"""API 路由 V4"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
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
    """按需生成洞察报告"""
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
    )
    orch._save_session(session)
    return {"status": "ok", "report": session.insight_report}


@router.get("/knowledge/{layer_name}")
async def get_knowledge(layer_name: str):
    """获取知识库内容"""
    orch = get_orchestrator()
    kb = orch.kb
    items = kb.layers.get(layer_name, [])
    return {"layer": layer_name, "count": len(items), "items": items}
