"""API 路由 — 前后端接口"""
from __future__ import annotations
import asyncio
import json
import math
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Optional
from auth import get_current_user
from database import ChatSessionRecord, EmotionAssessment, User, get_db
from guardrail import check_guardrail, build_crisis_response
from api.medical_resources import search_medical_resources
from agents.base import AgentRole

router = APIRouter(prefix="/api")

# 全局 Orchestrator（在 main.py 中初始化注入）
_orchestrator = None


def set_orchestrator(orch):
    global _orchestrator
    _orchestrator = orch


def get_orchestrator():
    if _orchestrator is None:
        raise HTTPException(500, "Orchestrator not initialized")
    return _orchestrator


# ─── 请求/响应模型 ────────────────────────────────────────────────────
class CreateSessionReq(BaseModel):
    user_name: str = ""
    cultural_identity: str = "unknown"
    language: str = "zh"
    study_abroad_months: int = Field(default=0, ge=0, le=600)


class CreateSessionResp(BaseModel):
    session_id: str
    user_id: str
    welcome_message: str


class VoiceAnalysisReq(BaseModel):
    transcript: str = Field(default="", max_length=5000)
    emotion_scores: dict[str, float] = Field(default_factory=dict)
    analysis_source: str = Field(default="gemini_text", max_length=32)


class ChatReq(BaseModel):
    session_id: str
    message: str
    input_mode: str = "text"
    voice_analysis: Optional[VoiceAnalysisReq] = None


class ChatResp(BaseModel):
    agent: str
    content: str
    suggestions: list[str] = Field(default_factory=list)
    emotion_level: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    agent_trace: list[dict] = Field(default_factory=list)  # Agent 思考链路


class TransitionReq(BaseModel):
    session_id: str
    target_agent: str


class SelfGuidedTrainingReq(BaseModel):
    technique: str = Field(min_length=1, max_length=100)
    duration_seconds: int = Field(default=0, ge=0, le=7200)
    before_distress: int = Field(ge=0, le=10)
    after_distress: int = Field(ge=0, le=10)
    user_feedback: str = Field(default="", max_length=500)


def _response_payload(response) -> dict:
    return {
        "agent": response.agent.value,
        "content": response.content,
        "suggestions": response.suggestions,
        "emotion_level": (
            response.emotion_level.value if response.emotion_level else None
        ),
        "metadata": response.metadata,
        "agent_trace": response.metadata.get("agent_trace", []),
    }


def _sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _validated_voice_scores(voice_analysis: VoiceAnalysisReq | None) -> dict:
    if voice_analysis is None:
        return {}
    scores = voice_analysis.emotion_scores
    if len(scores) > 60:
        raise HTTPException(400, "too many emotion scores")
    if any(
        len(name) > 64 or not math.isfinite(score)
        for name, score in scores.items()
    ):
        raise HTTPException(400, "invalid emotion score")
    return scores


def _owned_session(session_id: str, user: User):
    session = get_orchestrator().get_session(session_id)
    if session is None:
        raise HTTPException(404, "session not found")
    if session.profile.user_id != user.id:
        raise HTTPException(403, "session does not belong to this account")
    return session


def _ensure_counseling_session(session):
    """Skip the retired conversational questionnaire for non-crisis sessions."""
    if (
        session.current_agent == AgentRole.TRIAGE
        and not session.profile.crisis_triggered
    ):
        orch = get_orchestrator()
        orch.force_transition(session.session_id, AgentRole.COUNSELOR)
        return orch.get_session(session.session_id) or session
    return session


def _resume_pending_report_refresh(session):
    """Start a queued refresh when a read request observes no active worker."""
    if (
        session.report_refresh_pending
        and session.report_status != "generating"
    ):
        orch = get_orchestrator()
        orch.request_report_refresh(session.session_id)
        return orch.get_session(session.session_id) or session
    return session


@router.get("/psychoeducation/tip")
async def get_psychoeducation_tip(
    user: User = Depends(get_current_user),
):
    """Return one concise, daily psychoeducation sentence from the knowledge base."""
    topics = (
        (
            "正念 当下 情绪观察",
            "Mindfulness means noticing thoughts and feelings without having to follow or judge them.",
        ),
        (
            "焦虑 不确定性 认知机制",
            "Anxiety often grows when the brain treats uncertainty as a sign of danger.",
        ),
        (
            "孤独 归属需求 心理机制",
            "The need to belong is a basic human need, so loneliness can feel genuinely painful.",
        ),
        (
            "情绪表达 压抑 心理健康",
            "Naming an emotion can reduce the effort required to hold it inside.",
        ),
    )
    query, english_tip = topics[date.today().toordinal() % len(topics)]
    cultural_bg = (
        "abroad"
        if user.cultural_identity == "chinese_in_us"
        else "china" if user.cultural_identity == "american_in_china" else ""
    )
    context = await get_orchestrator().kb.search(
        query=query,
        cultural_bg=cultural_bg,
        agent_role="counselor",
        top_k=1,
    )
    content = context.split("] ", 1)[-1].strip() if context else ""
    first_sentence = content
    for punctuation in ("。", "！", "？"):
        if punctuation in first_sentence:
            first_sentence = first_sentence.split(punctuation, 1)[0] + punctuation
            break
    if not first_sentence or len(first_sentence) > 150:
        first_sentence = "情绪会随处境变化，准确说出此刻的感受，往往就是调节情绪的第一步。"
    return {
        "tip": english_tip if user.language == "en" else first_sentence,
        "source": "knowledge_base",
    }


# ─── 路由 ──────────────────────────────────────────────────────────────
@router.post("/session/create", response_model=CreateSessionResp)
async def create_session(
    req: CreateSessionReq,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    """创建新会话"""
    latest_assessment = database.scalar(
        select(EmotionAssessment)
        .where(
            EmotionAssessment.user_id == user.id,
            EmotionAssessment.assessment_type == "phq_gad",
        )
        .order_by(EmotionAssessment.created_at.desc())
        .limit(1)
    )
    orch = get_orchestrator()
    sid = orch.create_session(
        user_name=user.name or req.user_name,
        user_id=user.id,
        cultural_identity=user.cultural_identity,
        language=user.language,
        study_abroad_months=user.study_abroad_months,
        phq2_score=latest_assessment.phq2_score if latest_assessment else 0,
        gad2_score=latest_assessment.gad2_score if latest_assessment else 0,
    )
    # PHQ-2/GAD-2 is completed on the emotion page, not inside the chat.
    orch.force_transition(sid, AgentRole.COUNSELOR)
    # Make an assessment-based baseline available before the first chat turn.
    orch.request_report_refresh(sid)
    session = orch.get_session(sid)
    return CreateSessionResp(
        session_id=sid,
        user_id=session.profile.user_id,
        welcome_message=(
            (
                "Hi 🐼 Welcome to Panda Hug!\n\n"
                "I'm your mental wellness companion. "
                "I'm here to listen. What feels most important right now?"
            )
            if user.language == "en"
            else (
                "你好呀 🐼 欢迎来到 Panda Hug！\n\n"
                "我是你的心理陪伴助手。"
                "我会认真听你说，此刻最想聊的是什么？"
            )
        ),
    )


@router.post("/chat", response_model=ChatResp)
async def chat(
    req: ChatReq,
    user: User = Depends(get_current_user),
):
    """发送消息（含 Guardrail 危机拦截）"""
    session = _owned_session(req.session_id, user)
    input_mode = req.input_mode if req.input_mode in ("text", "voice") else "text"
    voice_scores = (
        _validated_voice_scores(req.voice_analysis)
        if input_mode == "voice"
        else {}
    )
    # ─── Guardrail: 零延迟危机检测（<1ms，纯正则，绕过 LLM）───
    guard = check_guardrail(req.message)
    if guard.triggered:
        # 物理熔断，直接返回危机响应
        lang = "zh" if any(ord(c) > 127 for c in req.message) else "en"
        crisis_resp = build_crisis_response(lang)
        crisis_resp["metadata"]["matched_keywords"] = guard.matched_keywords
        get_orchestrator().record_guardrail_crisis(
            session_id=req.session_id,
            user_message=req.message,
            response_content=crisis_resp["content"],
            input_mode=input_mode,
        )
        return ChatResp(**crisis_resp)

    # ─── 正常 Agent 链路 ───
    _ensure_counseling_session(session)
    orch = get_orchestrator()
    response = await orch.process_message(
        req.session_id,
        req.message,
        input_mode=input_mode,
        risk_hint=guard.risk_level,
        voice_emotion_scores=voice_scores,
        voice_analysis_source=(
            req.voice_analysis.analysis_source
            if req.voice_analysis and voice_scores
            else ""
        ),
    )
    return ChatResp(**_response_payload(response))


@router.post("/chat/stream")
async def chat_stream(
    req: ChatReq,
    user: User = Depends(get_current_user),
):
    """Stream the visible Agent reply while preserving final structured state."""
    session = _owned_session(req.session_id, user)
    input_mode = req.input_mode if req.input_mode in ("text", "voice") else "text"
    voice_scores = (
        _validated_voice_scores(req.voice_analysis)
        if input_mode == "voice"
        else {}
    )
    guard = check_guardrail(req.message)
    if not guard.triggered:
        _ensure_counseling_session(session)

    async def event_stream():
        if guard.triggered:
            lang = "zh" if any(ord(c) > 127 for c in req.message) else "en"
            crisis_resp = build_crisis_response(lang)
            crisis_resp["metadata"]["matched_keywords"] = guard.matched_keywords
            get_orchestrator().record_guardrail_crisis(
                session_id=req.session_id,
                user_message=req.message,
                response_content=crisis_resp["content"],
                input_mode=input_mode,
            )
            yield _sse_event({"type": "delta", "content": crisis_resp["content"]})
            yield _sse_event({"type": "final", "data": crisis_resp})
            return

        queue = asyncio.Queue()

        async def emit_text(content: str):
            await queue.put({"type": "delta", "content": content})

        async def run_orchestrator():
            try:
                response = await get_orchestrator().process_message(
                    req.session_id,
                    req.message,
                    input_mode=input_mode,
                    risk_hint=guard.risk_level,
                    voice_emotion_scores=voice_scores,
                    voice_analysis_source=(
                        req.voice_analysis.analysis_source
                        if req.voice_analysis and voice_scores
                        else ""
                    ),
                    on_text_chunk=emit_text,
                )
                await queue.put({
                    "type": "final",
                    "data": _response_payload(response),
                })
            except Exception as exc:
                await queue.put({
                    "type": "error",
                    "message": str(exc),
                })
            finally:
                await queue.put(None)

        producer = asyncio.create_task(run_orchestrator())
        while True:
            event = await queue.get()
            if event is None:
                break
            yield _sse_event(event)
        await producer

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/session/latest")
async def get_latest_session(
    since: float = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    query = select(ChatSessionRecord).where(
        ChatSessionRecord.user_id == user.id,
    )
    if since:
        query = query.where(ChatSessionRecord.created_at >= since)
    record = database.scalar(
        query.order_by(ChatSessionRecord.last_active.desc()).limit(1)
    )
    return {
        "session_id": record.id if record else None,
        "created_at": record.created_at if record else None,
        "last_active": record.last_active if record else None,
    }


@router.get("/session/{session_id}/state")
async def get_state(
    session_id: str,
    user: User = Depends(get_current_user),
):
    """获取会话状态"""
    _resume_pending_report_refresh(
        _owned_session(session_id, user)
    )
    orch = get_orchestrator()
    state = orch.get_state(session_id)
    if "error" in state:
        raise HTTPException(404, state["error"])
    return state


@router.get("/session/{session_id}/history")
async def get_history(
    session_id: str,
    user: User = Depends(get_current_user),
):
    """获取会话历史（用于恢复对话）"""
    orch = get_orchestrator()
    session = _resume_pending_report_refresh(
        _ensure_counseling_session(
            _owned_session(session_id, user)
        )
    )
    # 将 history 转为前端可用格式
    messages = []
    for msg in session.history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "agent": msg.get("agent") if msg["role"] == "assistant" else None,
            "metadata": msg.get("metadata", {}),
        })
    return {
        "session_id": session_id,
        "messages": messages,
        "state": orch.get_state(session_id),
    }


@router.get("/session/{session_id}/memory")
async def get_memory(
    session_id: str,
    user: User = Depends(get_current_user),
):
    """Return a user-facing view of remembered preferences and aggregate counts."""
    orch = get_orchestrator()
    session = _owned_session(session_id, user)
    memory = orch.get_user_memory(session.profile.user_id)
    stored_profile = memory.get("profile", {})
    return {
        "preferences": {
            "cultural_identity": stored_profile.get("cultural_identity", "unknown"),
            "language": stored_profile.get("language", "zh"),
            "study_abroad_months": stored_profile.get("study_abroad_months", 0),
        },
        "metrics": {
            "session_count": len(memory.get("sessions", [])),
            "interaction_count": len(memory.get("observations", [])),
            "training_count": len(memory.get("training_records", [])),
        },
    }


@router.get("/session/{session_id}/report")
async def get_report_by_date(
    session_id: str,
    date: str = Query(pattern=r"^\d{4}-\d{2}-\d{2}$"),
    user: User = Depends(get_current_user),
):
    session = _owned_session(session_id, user)
    memory = get_orchestrator().get_user_memory(session.profile.user_id)
    matches = [
        item for item in memory.get("insight_reports", [])
        if datetime.fromtimestamp(
            item.get("timestamp", 0)
        ).date().isoformat() == date
    ]
    if not matches:
        raise HTTPException(404, "report not found for this date")
    latest = max(matches, key=lambda item: item.get("timestamp", 0))
    return {
        "date": date,
        "report": latest.get("report", {}),
        "session_id": latest.get("session_id"),
    }


@router.post("/session/{session_id}/voice-analysis")
async def record_voice_analysis(
    session_id: str,
    req: VoiceAnalysisReq,
    user: User = Depends(get_current_user),
):
    """Persist supplemental emotion analysis for a voice transcript."""
    _owned_session(session_id, user)
    if not req.transcript.strip():
        raise HTTPException(400, "transcript is required")
    scores = _validated_voice_scores(req)

    record = await get_orchestrator().record_voice_analysis(
        session_id=session_id,
        transcript=req.transcript,
        emotion_scores=scores,
        analysis_source=req.analysis_source,
    )
    if record is None:
        raise HTTPException(404, "session not found")
    return record


@router.get("/session/{session_id}/growth")
async def get_growth(
    session_id: str,
    country: str = Query(default="", max_length=8),
    region: str = Query(default="", max_length=100),
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    """获取当前用户的成长记录"""
    orch = get_orchestrator()
    session = _owned_session(session_id, user)
    growth = orch.get_user_growth(session.profile.user_id)
    assessments = database.scalars(
        select(EmotionAssessment)
        .where(EmotionAssessment.user_id == user.id)
        .order_by(EmotionAssessment.created_at.asc())
    ).all()
    calendar_by_date = {
        item["date"]: item for item in growth.get("calendar", [])
    }
    for assessment in assessments:
        day = datetime.fromtimestamp(assessment.created_at).date().isoformat()
        distress = round(
            max(assessment.phq2_score, assessment.gad2_score) / 6 * 100,
            1,
        )
        growth.setdefault("emotion_trend", []).append({
            "timestamp": assessment.created_at,
            "date": day,
            "distress_index": distress,
            "intensity": distress,
            "sentiment": (
                "positive" if assessment.bear_status == "happy"
                else "negative"
            ),
            "emotion_tags": [assessment.selected_emotion],
            "source": "assessment",
            "voice_analysis": None,
        })
        entry = calendar_by_date.setdefault(day, {
            "date": day,
            "average_distress": distress,
            "bear_status": (
                "充满活力" if assessment.bear_status == "happy"
                else "比较平静" if assessment.bear_status == "calm"
                else "有些低落"
            ),
            "report_count": 0,
            "training_count": 0,
        })
        entry["assessment_count"] = entry.get("assessment_count", 0) + 1

    growth["emotion_trend"] = sorted(
        growth.get("emotion_trend", []),
        key=lambda item: item.get("timestamp", 0),
    )
    growth["calendar"] = sorted(calendar_by_date.values(), key=lambda item: item["date"])
    low_days = _consecutive_assessment_low_days(assessments)
    if low_days >= 14:
        resources = (
            search_medical_resources(
                database,
                country=country,
                region=region,
                limit=5,
            )
            if region
            else []
        )
        growth["care_alert"] = {
            "triggered": True,
            "reason": "连续14天情绪持续低落",
            "resources": resources,
            "resource_status": (
                "ready" if resources
                else "no_matches" if region
                else "region_required"
            ),
        }
    else:
        growth.setdefault("care_alert", {})["resources"] = []
        growth["care_alert"]["resource_status"] = "available_when_needed"
    return growth


def _consecutive_assessment_low_days(
    assessments: list[EmotionAssessment],
) -> int:
    daily_status = {}
    for assessment in assessments:
        day = datetime.fromtimestamp(assessment.created_at).date()
        daily_status[day] = max(
            daily_status.get(day, 0),
            max(assessment.phq2_score, assessment.gad2_score),
        )
    if not daily_status:
        return 0
    current = max(daily_status)
    count = 0
    while daily_status.get(current, 0) >= 4:
        count += 1
        current -= timedelta(days=1)
    return count


@router.post("/session/{session_id}/training/self-guided")
async def record_self_guided_training(
    session_id: str,
    req: SelfGuidedTrainingReq,
    user: User = Depends(get_current_user),
):
    """Record a completed self-guided exercise."""
    _owned_session(session_id, user)
    before = {
        "captured_at": 0,
        "distress_index": req.before_distress * 10,
        "source": "self_guided",
    }
    after = {
        "captured_at": 0,
        "distress_index": req.after_distress * 10,
        "source": "self_guided",
    }
    change = (req.before_distress - req.after_distress) * 10
    record = get_orchestrator().record_self_guided_training(
        session_id,
        {
            "technique": req.technique,
            "duration_seconds": req.duration_seconds,
            "user_feedback": req.user_feedback,
            "improvement": (
                "明显改善" if change >= 30
                else "有所改善" if change > 0
                else "暂未改善" if change == 0
                else "感受加重"
            ),
            "before": before,
            "after": after,
            "distress_change": change,
        },
    )
    if record is None:
        raise HTTPException(404, "session not found")
    return record


@router.post("/session/transition")
async def force_transition(
    req: TransitionReq,
    user: User = Depends(get_current_user),
):
    """手动切换 Agent"""
    from agents.base import AgentRole
    orch = get_orchestrator()
    _owned_session(req.session_id, user)
    try:
        target = AgentRole(req.target_agent)
    except ValueError:
        raise HTTPException(400, f"Invalid agent role: {req.target_agent}")
    orch.force_transition(req.session_id, target)
    return {"status": "ok", "current_agent": req.target_agent}
