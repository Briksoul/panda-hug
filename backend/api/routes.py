"""API 路由 V4 — 前后端接口"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from guardrail import check_guardrail, build_crisis_response

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
    agent_trace: list[dict] = Field(default_factory=list)
    action_links: list[dict] = Field(default_factory=list)  # V4: 导航链接


class NavigateReq(BaseModel):
    session_id: str
    target_phase: str


class TransitionReq(BaseModel):
    session_id: str
    target_agent: str


# ─── 路由 ──────────────────────────────────────────────────────────────
@router.post("/session/create", response_model=CreateSessionResp)
async def create_session(req: CreateSessionReq):
    """创建新会话"""
    orch = get_orchestrator()
    sid = orch.create_session(req.user_name, req.language)

    is_zh = req.language == "zh"
    welcome = (
        "Hi，我是 Panda！\n\n"
        "无论你来自中国、美国，还是正在异国求学的留学生，\n"
        "当你开心、疲惫、焦虑、迷茫的时候，\n"
        "我都会在这里陪伴你。\n\n"
        "在接下来的交流中，我会陪你一起理解情绪、整理思绪、寻找力量。"
    ) if is_zh else (
        "Hi, I'm Panda!\n\n"
        "Whether you're from China, the US, or studying abroad,\n"
        "whether you're happy, tired, anxious, or confused,\n"
        "I'll be here for you.\n\n"
        "Together, we'll understand your emotions, organize your thoughts, and find strength."
    )

    return CreateSessionResp(session_id=sid, welcome_message=welcome)


@router.post("/chat", response_model=ChatResp)
async def chat(req: ChatReq):
    """发送消息（含 Guardrail 危机拦截）"""
    # Guardrail: 零延迟危机检测
    guard = check_guardrail(req.message)
    if guard.triggered:
        lang = "zh" if any(ord(c) > 127 for c in req.message) else "en"
        crisis_resp = build_crisis_response(lang)
        crisis_resp["metadata"]["matched_keywords"] = guard.matched_keywords
        return ChatResp(**crisis_resp)

    # 正常 Agent 链路
    orch = get_orchestrator()
    response = await orch.process_message(req.session_id, req.message)
    return ChatResp(
        agent=response.agent.value,
        content=response.content,
        suggestions=response.suggestions,
        emotion_level=response.emotion_level.value if response.emotion_level else None,
        metadata=response.metadata,
        agent_trace=response.metadata.get("agent_trace", []),
        action_links=response.action_links,
    )


@router.post("/navigate", response_model=ChatResp)
async def navigate(req: NavigateReq):
    """导航到指定阶段"""
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
    """获取会话状态"""
    orch = get_orchestrator()
    state = orch.get_state(session_id)
    if "error" in state:
        raise HTTPException(404, state["error"])
    return state


@router.get("/session/{session_id}/history")
async def get_history(session_id: str):
    """获取会话历史"""
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
    return {
        "session_id": session_id,
        "messages": messages,
        "state": orch.get_state(session_id),
    }


@router.post("/session/transition")
async def force_transition(req: TransitionReq):
    """手动切换 Agent"""
    from agents.base import AgentRole
    orch = get_orchestrator()
    try:
        target = AgentRole(req.target_agent)
    except ValueError:
        raise HTTPException(400, f"Invalid agent role: {req.target_agent}")
    # 使用 navigate 代替
    return {"status": "ok", "current_agent": req.target_agent}
