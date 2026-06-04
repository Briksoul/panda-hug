"""API 路由 — 前后端接口"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

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


class TransitionReq(BaseModel):
    session_id: str
    target_agent: str


# ─── 路由 ──────────────────────────────────────────────────────────────
@router.post("/session/create", response_model=CreateSessionResp)
async def create_session(req: CreateSessionReq):
    """创建新会话"""
    orch = get_orchestrator()
    sid = orch.create_session(req.user_name)
    return CreateSessionResp(
        session_id=sid,
        welcome_message=(
            "你好呀 🐼 欢迎来到 Panda Hug！\n\n"
            "我是你的心理陪伴助手，很高兴见到你。"
            "在我们开始之前，可以先告诉我你的名字吗？\n\n"
            "另外，最近两周你感觉怎么样？"
        ),
    )


@router.post("/chat", response_model=ChatResp)
async def chat(req: ChatReq):
    """发送消息"""
    orch = get_orchestrator()
    response = await orch.process_message(req.session_id, req.message)
    return ChatResp(
        agent=response.agent.value,
        content=response.content,
        suggestions=response.suggestions,
        emotion_level=response.emotion_level.value if response.emotion_level else None,
        metadata=response.metadata,
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
    """获取会话历史（用于恢复对话）"""
    orch = get_orchestrator()
    session = orch.get_session(session_id)
    if not session:
        raise HTTPException(404, "session not found")
    # 将 history 转为前端可用格式
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
    orch.force_transition(req.session_id, target)
    return {"status": "ok", "current_agent": req.target_agent}
