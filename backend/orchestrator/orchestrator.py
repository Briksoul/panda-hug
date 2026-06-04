"""Orchestrator — Agent 调度器，管理对话流程和状态机"""
from __future__ import annotations
import uuid
import time
import json
from pathlib import Path
from dataclasses import dataclass, field, asdict

from agents.base import AgentRole, AgentResponse, UserProfile, EmotionLevel, CulturalBackground
from agents.triage import TriageAgent
from agents.cultural import CulturalAnalystAgent
from agents.coach import CoachAgent
from agents.crisis import CrisisAgent
from agents.sensing import SensingAgent
from knowledge.vector_db import KnowledgeBase

SESSIONS_DIR = Path(__file__).parent.parent / "data" / "sessions"


@dataclass
class SessionState:
    """会话状态"""
    session_id: str = ""
    profile: UserProfile = field(default_factory=UserProfile)
    current_agent: AgentRole = AgentRole.TRIAGE
    history: list[dict[str, str]] = field(default_factory=list)
    agent_messages: list[dict] = field(default_factory=list)
    phase: str = "triage"  # triage → cultural → coach → follow_up
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)


class Orchestrator:
    """Agent 调度器 — 管理多 Agent 协作"""

    def __init__(self, knowledge_base: KnowledgeBase | None = None):
        self.sessions: dict[str, SessionState] = {}
        self.kb = knowledge_base or KnowledgeBase()
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

        # 初始化 Agent
        self.agents = {
            AgentRole.TRIAGE: TriageAgent(),
            AgentRole.CULTURAL: CulturalAnalystAgent(),
            AgentRole.COACH: CoachAgent(),
            AgentRole.CRISIS: CrisisAgent(),
        }
        self.sensing = SensingAgent()

        # 启动时加载已有会话
        self._load_all_sessions()

    # ─── 持久化 ─────────────────────────────────────────────
    def _save_session(self, session: SessionState):
        """保存单个会话到文件"""
        data = {
            "session_id": session.session_id,
            "current_agent": session.current_agent.value,
            "phase": session.phase,
            "history": session.history,
            "created_at": session.created_at,
            "last_active": session.last_active,
            "profile": {
                "user_id": session.profile.user_id,
                "name": session.profile.name,
                "cultural_bg": session.profile.cultural_bg.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "session_turns": session.profile.session_turns,
                "crisis_triggered": session.profile.crisis_triggered,
                "tags": session.profile.tags,
            },
        }
        path = SESSIONS_DIR / f"{session.session_id}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2))

    def _load_all_sessions(self):
        """启动时加载所有会话"""
        for f in SESSIONS_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text())
                profile_data = data.get("profile", {})
                profile = UserProfile(
                    user_id=profile_data.get("user_id", ""),
                    name=profile_data.get("name", ""),
                    cultural_bg=CulturalBackground(profile_data.get("cultural_bg", "unknown")),
                    phq2_score=profile_data.get("phq2_score", 0),
                    gad2_score=profile_data.get("gad2_score", 0),
                    emotion_level=EmotionLevel(profile_data.get("emotion_level", "mild")),
                    session_turns=profile_data.get("session_turns", 0),
                    crisis_triggered=profile_data.get("crisis_triggered", False),
                    tags=profile_data.get("tags", []),
                )
                session = SessionState(
                    session_id=data["session_id"],
                    profile=profile,
                    current_agent=AgentRole(data.get("current_agent", "triage")),
                    phase=data.get("phase", "triage"),
                    history=data.get("history", []),
                    created_at=data.get("created_at", 0),
                    last_active=data.get("last_active", 0),
                )
                self.sessions[session.session_id] = session
            except Exception:
                continue

    def create_session(self, user_name: str = "") -> str:
        """创建新会话"""
        sid = str(uuid.uuid4())[:8]
        session = SessionState(
            session_id=sid,
            profile=UserProfile(user_id=sid, name=user_name),
        )
        self.sessions[sid] = session
        self._save_session(session)
        return sid

    def get_session(self, session_id: str) -> SessionState | None:
        return self.sessions.get(session_id)

    async def process_message(self, session_id: str, user_message: str) -> AgentResponse:
        """处理用户消息的核心流程"""
        session = self.sessions.get(session_id)
        if not session:
            return AgentResponse(
                agent=AgentRole.TRIAGE,
                content="会话不存在，请重新开始。",
            )

        session.last_active = time.time()
        profile = session.profile
        profile.session_turns += 1

        # ─── Step 1: Sensing Agent 隐形分析 ───
        sensing_result = await self.sensing.analyze(user_message, profile)

        # 危机关键词 → 强制切换危机模式
        if sensing_result.should_trigger_crisis:
            session.current_agent = AgentRole.CRISIS
            session.phase = "crisis"
            profile.emotion_level = EmotionLevel.CRISIS
            profile.crisis_triggered = True

        # ─── Step 2: 知识库检索 ───
        knowledge_ctx = ""
        if session.current_agent in (AgentRole.CULTURAL, AgentRole.COACH):
            knowledge_ctx = await self.kb.search(
                query=user_message,
                cultural_bg=profile.cultural_bg.value,
                agent_role=session.current_agent.value,
            )

        # ─── Step 3: 当前 Agent 处理 ───
        agent = self.agents.get(session.current_agent)
        if not agent:
            agent = self.agents[AgentRole.TRIAGE]

        # 注入 Sensing 结果到 metadata
        session.history.append({"role": "user", "content": user_message})

        response = await agent.chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=knowledge_ctx,
        )

        # 记录 Agent 回复
        session.history.append({"role": "assistant", "content": response.content})

        # ─── Step 4: 状态转移 ───
        if response.should_transition and response.next_agent:
            self._transition(session, response.next_agent)

        # 补充感知元数据
        response.metadata["sensing"] = {
            "sentiment": sensing_result.sentiment,
            "emotion_tags": sensing_result.emotion_tags,
            "intensity": sensing_result.intensity,
        }
        response.metadata["session_id"] = session_id
        response.metadata["turn"] = profile.session_turns

        # 持久化保存
        self._save_session(session)

        return response

    def _transition(self, session: SessionState, next_agent: AgentRole):
        """Agent 切换"""
        session.current_agent = next_agent
        phase_map = {
            AgentRole.TRIAGE: "triage",
            AgentRole.CULTURAL: "cultural",
            AgentRole.COACH: "coach",
            AgentRole.CRISIS: "crisis",
        }
        session.phase = phase_map.get(next_agent, "unknown")

    def force_transition(self, session_id: str, agent_role: AgentRole):
        """手动切换 Agent"""
        session = self.sessions.get(session_id)
        if session:
            self._transition(session, agent_role)

    def get_state(self, session_id: str) -> dict:
        """获取会话状态"""
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "session not found"}
        return {
            "session_id": session.session_id,
            "current_agent": session.current_agent.value,
            "phase": session.phase,
            "profile": {
                "name": session.profile.name,
                "cultural_bg": session.profile.cultural_bg.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "turns": session.profile.session_turns,
                "crisis_triggered": session.profile.crisis_triggered,
            },
        }
