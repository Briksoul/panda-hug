"""API 路由 V5 — SSE 流式报告 + 虚拟社交演练 + 双语"""
from __future__ import annotations
import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from guardrail import check_guardrail, build_crisis_response
from agents.base import AgentRole

router = APIRouter(prefix="/api")
_orchestrator = None


def set_orchestrator(orch):
    global _orchestrator
    _orchestrator = orch


def get_orchestrator():
    if _orchestrator is None:
        raise HTTPException(500, "Orchestrator not initialized")
    return _orchestrator


class CreateSessionReq(BaseModel):
    user_name: str = ""
    language: str = "zh"


class CreateSessionResp(BaseModel):
    session_id: str
    welcome_message: str


class ChatReq(BaseModel):
    session_id: str
    message: str


class ChatResp(BaseModel):
    agent: str
    content: str
    suggestions: list[str] = Field(default_factory=list)
    emotion_level: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    action_links: list[dict] = Field(default_factory=list)


class NavigateReq(BaseModel):
    session_id: str
    target_phase: str


class UpdateProfileReq(BaseModel):
    session_id: str
    study_abroad_months: Optional[int] = None
    cultural_bg: Optional[str] = None


@router.post("/session/create", response_model=CreateSessionResp)
async def create_session(req: CreateSessionReq):
    orch = get_orchestrator()
    sid = orch.create_session(req.user_name, req.language)
    is_zh = req.language == "zh"
    welcome = (
        "Hi，我是 Panda！\n\n"
        "无论你来自中国、美国，还是正在异国求学的留学生，\n"
        "当你开心、疲惫、焦虑、迷茫的时候，\n"
        "我都会在这里陪伴你。"
    ) if is_zh else (
        "Hi, I'm Panda!\n\n"
        "Whether you're from China, the US, or studying abroad,\n"
        "I'll be here for you."
    )
    return CreateSessionResp(session_id=sid, welcome_message=welcome)


@router.post("/chat", response_model=ChatResp)
async def chat(req: ChatReq):
    guard = check_guardrail(req.message)
    if guard.triggered:
        lang = "zh" if any(ord(c) > 127 for c in req.message) else "en"
        crisis_resp = build_crisis_response(lang)
        crisis_resp["metadata"]["matched_keywords"] = guard.matched_keywords
        return ChatResp(**crisis_resp)

    orch = get_orchestrator()
    response = await orch.process_message(req.session_id, req.message)
    return ChatResp(
        agent=response.agent.value,
        content=response.content,
        suggestions=response.suggestions,
        emotion_level=response.emotion_level.value if response.emotion_level else None,
        metadata=response.metadata,
        action_links=response.action_links,
    )


@router.post("/navigate", response_model=ChatResp)
async def navigate(req: NavigateReq):
    orch = get_orchestrator()
    response = orch.navigate_to_phase(req.session_id, req.target_phase)
    return ChatResp(
        agent=response.agent.value,
        content=response.content,
        suggestions=response.suggestions,
        emotion_level=response.emotion_level.value if response.emotion_level else None,
        metadata=response.metadata,
        action_links=response.action_links,
    )


@router.get("/session/{session_id}/state")
async def get_state(session_id: str):
    orch = get_orchestrator()
    state = orch.get_state(session_id)
    if "error" in state:
        raise HTTPException(404, state["error"])
    return state


@router.get("/session/{session_id}/history")
async def get_history(session_id: str):
    orch = get_orchestrator()
    session = orch.get_session(session_id)
    if not session:
        raise HTTPException(404, "session not found")
    messages = []
    for msg in session.history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "agent": session.current_agent.value if msg["role"] == "assistant" else None,
        })
    return {"session_id": session_id, "messages": messages, "state": orch.get_state(session_id)}


@router.post("/session/{session_id}/generate_report")
async def generate_report(session_id: str):
    """按需生成洞察报告（兜底：即使数据不完整也生成）"""
    orch = get_orchestrator()
    session = orch.get_session(session_id)
    if not session:
        raise HTTPException(404, "session not found")

    profile = session.profile

    # 用已有数据生成报告（即使数据不完整）
    cf = await orch.agents[AgentRole.CASE_FORMULATION].build(session.counseling_data, profile)
    session.case_formulation = {
        "core_event": cf.core_event,
        "core_emotions": cf.core_emotions,
        "auto_thoughts": cf.auto_thoughts,
        "behavior_pattern": cf.behavior_pattern,
        "social_support": cf.social_support,
    }
    session.insight_report = await orch.agents[AgentRole.INSIGHT_REPORT].generate(
        case_formulation=session.case_formulation,
        cultural_analysis={},
        profile=profile,
        history_text=session.counseling_data.get("history_text", ""),
    )
    orch._save_session(session)
    return {"status": "ok", "report": session.insight_report}


@router.get("/session/{session_id}/generate_report_stream")
async def generate_report_stream(session_id: str):
    """V5: SSE 流式生成洞察报告"""
    orch = get_orchestrator()
    session = orch.get_session(session_id)
    if not session:
        raise HTTPException(404, "session not found")

    profile = session.profile
    session.report_generation_in_progress = True

    async def event_generator():
        try:
            # 先构建案例概念化
            cf = await orch.agents[AgentRole.CASE_FORMULATION].build(session.counseling_data, profile)
            session.case_formulation = {
                "core_event": cf.core_event,
                "core_emotions": cf.core_emotions,
                "auto_thoughts": cf.auto_thoughts,
                "behavior_pattern": cf.behavior_pattern,
                "social_support": cf.social_support,
            }

            # 流式生成报告
            async for chunk in orch.agents[AgentRole.INSIGHT_REPORT].generate_stream(
                case_formulation=session.case_formulation,
                cultural_analysis={},
                profile=profile,
                history_text=session.counseling_data.get("history_text", ""),
            ):
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

                if chunk.get("type") == "complete":
                    session.insight_report = chunk.get("report", {})
                    orch._save_session(session)

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            session.report_generation_in_progress = False

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/knowledge/{layer_name}")
async def get_knowledge(layer_name: str):
    """获取知识库内容"""
    orch = get_orchestrator()
    kb = orch.kb
    items = kb.layers.get(layer_name, [])
    return {"layer": layer_name, "count": len(items), "items": items}


@router.post("/session/{session_id}/update_profile")
async def update_profile(session_id: str, req: UpdateProfileReq):
    """V5: 更新用户档案（留学时长、文化背景等）"""
    orch = get_orchestrator()
    session = orch.get_session(session_id)
    if not session:
        raise HTTPException(404, "session not found")

    if req.study_abroad_months is not None:
        session.profile.study_abroad_months = req.study_abroad_months
    if req.cultural_bg is not None:
        from agents.base import CulturalBackground
        try:
            session.profile.cultural_bg = CulturalBackground(req.cultural_bg)
        except ValueError:
            pass

    orch._save_session(session)
    return {"status": "ok", "profile": orch.get_state(session_id)["profile"]}
