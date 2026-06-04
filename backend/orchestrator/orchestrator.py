"""CognitiveOrchestrator — 系统总控协调（V2 升级版）"""
from __future__ import annotations
import uuid
import time
import json
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum

from agents.base import AgentRole, AgentResponse, UserProfile, EmotionLevel, CulturalBackground
from agents.triage import TriageAgent
from agents.counselor import CounselorAgent
from agents.cultural import CulturalAnalystAgent
from agents.coach import CoachAgent
from agents.crisis import CrisisAgent
from agents.sensing import SensingAgent
from agents.risk import RiskAgent
from agents.case_formulation import CaseFormulationAgent, CaseFormulation
from agents.supervisor import SupervisorAgent
from agents.insight_report import InsightReportAgent
from knowledge.vector_db import KnowledgeBase

SESSIONS_DIR = Path(__file__).parent.parent / "data" / "sessions"


class Phase(str, Enum):
    TRIAGE = "triage"
    COUNSELING = "counseling"
    INSIGHT_REPORT = "insight_report"
    COACHING = "coaching"
    FOLLOW_UP = "follow_up"


@dataclass
class SessionState:
    """会话状态"""
    session_id: str = ""
    profile: UserProfile = field(default_factory=UserProfile)
    current_agent: AgentRole = AgentRole.TRIAGE
    phase: Phase = Phase.TRIAGE
    history: list[dict[str, str]] = field(default_factory=list)
    counseling_data: dict = field(default_factory=dict)
    case_formulation: dict = field(default_factory=dict)
    cultural_analysis: dict = field(default_factory=dict)
    insight_report: dict = field(default_factory=dict)
    training_records: list[dict] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)


class CognitiveOrchestrator:
    """系统总控协调 — 管理多智能体协作"""

    def __init__(self, knowledge_base: KnowledgeBase | None = None):
        self.sessions: dict[str, SessionState] = {}
        self.kb = knowledge_base or KnowledgeBase()
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

        # 初始化前台 Agent
        self.agents = {
            AgentRole.TRIAGE: TriageAgent(),
            AgentRole.COUNSELOR: CounselorAgent(),
            AgentRole.CULTURAL: CulturalAnalystAgent(),
            AgentRole.COACH: CoachAgent(),
            AgentRole.CRISIS: CrisisAgent(),
        }

        # 初始化后台 Agent
        self.sensing = SensingAgent()
        self.risk = RiskAgent()
        self.case_formulation = CaseFormulationAgent()
        self.supervisor = SupervisorAgent()
        self.insight_report = InsightReportAgent()

        # 启动时加载已有会话
        self._load_all_sessions()

    # ─── 会话管理 ─────────────────────────────────────────────
    def create_session(self, user_name: str = "") -> str:
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

    # ─── 核心处理流程 ──────────────────────────────────────────
    async def process_message(self, session_id: str, user_message: str) -> AgentResponse:
        session = self.sessions.get(session_id)
        if not session:
            return AgentResponse(
                agent=AgentRole.TRIAGE,
                content="会话不存在，请重新开始。",
            )

        session.last_active = time.time()
        profile = session.profile
        profile.session_turns += 1
        agent_trace = []

        # ─── Step 1: Sensing Agent（后台情感分析）───
        agent_trace.append({
            "agent": "sensing", "status": "analyzing",
            "label": "Sensing Agent 多模态情感分析...",
        })
        sensing_result = await self.sensing.analyze(user_message, profile)
        agent_trace[-1]["status"] = "done"
        agent_trace[-1]["detail"] = f"情感={sensing_result.sentiment}, 强度={sensing_result.intensity:.1f}"

        # ─── Step 2: Risk Agent（后台危机监测）───
        agent_trace.append({
            "agent": "risk", "status": "scanning",
            "label": "Risk Agent 危机风险扫描...",
        })
        risk_result = {"risk_level": 0, "action": "continue"}
        if sensing_result.sentiment == "negative" or sensing_result.intensity > 0.6:
            risk_result = await self.risk.quick_check(user_message, profile)
        agent_trace[-1]["status"] = "done"
        agent_trace[-1]["detail"] = f"风险等级={risk_result.get('risk_level', 0)}"

        # 危机熔断
        if risk_result.get("action") in ("interrupt", "crisis"):
            agent_trace.append({
                "agent": "crisis", "status": "triggered",
                "label": "🚨 Crisis Agent 激活！",
            })
            session.current_agent = AgentRole.CRISIS
            session.phase = Phase.TRIAGE
            profile.emotion_level = EmotionLevel.CRISIS
            profile.crisis_triggered = True

        # ─── Step 3: 知识库检索 ───
        knowledge_ctx = ""
        if session.current_agent in (AgentRole.CULTURAL, AgentRole.COACH, AgentRole.COUNSELOR):
            agent_trace.append({
                "agent": "knowledge", "status": "searching",
                "label": "知识库检索匹配规则...",
            })
            knowledge_ctx = await self.kb.search(
                query=user_message,
                cultural_bg=profile.cultural_bg.value,
                agent_role=session.current_agent.value,
            )
            agent_trace[-1]["status"] = "done"
            lines = len(knowledge_ctx.split("\n")) if knowledge_ctx else 0
            agent_trace[-1]["detail"] = f"命中 {lines} 条规则"

        # ─── Step 4: 当前前台 Agent 处理 ───
        agent_labels = {
            AgentRole.TRIAGE: "Triage Agent 分诊筛查中...",
            AgentRole.COUNSELOR: "Counselor Agent 心理咨询中...",
            AgentRole.CULTURAL: "Cultural Agent 跨文化分析中...",
            AgentRole.COACH: "Coach Agent 干预训练中...",
            AgentRole.CRISIS: "Crisis Agent 危机干预中...",
        }
        agent_trace.append({
            "agent": session.current_agent.value,
            "status": "thinking",
            "label": agent_labels.get(session.current_agent, "Agent 处理中..."),
        })

        agent = self.agents.get(session.current_agent)
        if not agent:
            agent = self.agents[AgentRole.TRIAGE]

        session.history.append({"role": "user", "content": user_message})

        response = await agent.chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=knowledge_ctx,
        )

        agent_trace[-1]["status"] = "done"

        # ─── Step 5: Supervisor Agent（后台质量监控，仅 Counseling 阶段）───
        if session.current_agent == AgentRole.COUNSELOR and not response.should_transition:
            agent_trace.append({
                "agent": "supervisor", "status": "evaluating",
                "label": "Supervisor Agent 督导评估中...",
            })
            eval_result = await self.supervisor.evaluate(
                counselor_response=response.content,
                user_message=user_message,
                history=session.history,
                profile=profile,
            )
            agent_trace[-1]["status"] = "done"
            agent_trace[-1]["detail"] = f"质量={eval_result.get('overall_score', 0):.1f}"

        # ─── Step 6: CaseFormulation Agent（后台构建，仅 Counseling 阶段）───
        if session.current_agent == AgentRole.COUNSELOR and response.metadata.get("counseling_data"):
            session.counseling_data.update(response.metadata["counseling_data"])

            if session.counseling_data:
                agent_trace.append({
                    "agent": "case_formulation", "status": "building",
                    "label": "CaseFormulation 构建心理模型...",
                })
                cf = await self.case_formulation.build(session.counseling_data, profile)
                session.case_formulation = {
                    "core_event": cf.core_event,
                    "core_emotions": cf.core_emotions,
                    "auto_thoughts": cf.auto_thoughts,
                    "behavior_pattern": cf.behavior_pattern,
                    "social_support": cf.social_support,
                    "psychological_mechanisms": cf.psychological_mechanisms,
                    "mechanism_chain": cf.mechanism_chain,
                    "risk_level": cf.risk_level,
                }
                agent_trace[-1]["status"] = "done"

        # 记录 Agent 回复
        session.history.append({"role": "assistant", "content": response.content})

        # ─── Step 7: 状态转移 ───
        if response.should_transition and response.next_agent:
            agent_trace.append({
                "agent": response.next_agent.value,
                "status": "transition",
                "label": f"切换 → {agent_labels.get(response.next_agent, '')}",
            })
            self._transition(session, response.next_agent)

        # 如果从 Counselor 切换到 Cultural，自动生成洞察报告
        if (session.current_agent == AgentRole.CULTURAL
                and session.case_formulation
                and not session.insight_report):
            agent_trace.append({
                "agent": "insight_report", "status": "generating",
                "label": "InsightReport 生成心理洞察报告...",
            })
            session.insight_report = await self.insight_report.generate(
                case_formulation=session.case_formulation,
                cultural_analysis=session.cultural_analysis,
                profile=profile,
            )
            agent_trace[-1]["status"] = "done"

        # 补充元数据
        response.metadata["sensing"] = {
            "sentiment": sensing_result.sentiment,
            "emotion_tags": sensing_result.emotion_tags,
            "intensity": sensing_result.intensity,
        }
        response.metadata["session_id"] = session_id
        response.metadata["turn"] = profile.session_turns
        response.metadata["agent_trace"] = agent_trace
        response.metadata["phase"] = session.phase.value

        # 持久化
        self._save_session(session)
        return response

    def _transition(self, session: SessionState, next_agent: AgentRole):
        session.current_agent = next_agent
        phase_map = {
            AgentRole.TRIAGE: Phase.TRIAGE,
            AgentRole.COUNSELOR: Phase.COUNSELING,
            AgentRole.CULTURAL: Phase.INSIGHT_REPORT,
            AgentRole.COACH: Phase.COACHING,
            AgentRole.CRISIS: Phase.TRIAGE,
        }
        session.phase = phase_map.get(next_agent, Phase.TRIAGE)

    def force_transition(self, session_id: str, agent_role: AgentRole):
        session = self.sessions.get(session_id)
        if session:
            self._transition(session, agent_role)

    def get_state(self, session_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "session not found"}
        return {
            "session_id": session.session_id,
            "current_agent": session.current_agent.value,
            "phase": session.phase.value,
            "profile": {
                "name": session.profile.name,
                "cultural_bg": session.profile.cultural_bg.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "turns": session.profile.session_turns,
                "crisis_triggered": session.profile.crisis_triggered,
            },
            "insight_report": session.insight_report,
            "training_records": session.training_records,
        }

    # ─── 持久化 ─────────────────────────────────────────────
    def _save_session(self, session: SessionState):
        data = {
            "session_id": session.session_id,
            "current_agent": session.current_agent.value,
            "phase": session.phase.value,
            "history": session.history,
            "counseling_data": session.counseling_data,
            "case_formulation": session.case_formulation,
            "cultural_analysis": session.cultural_analysis,
            "insight_report": session.insight_report,
            "training_records": session.training_records,
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
        for f in SESSIONS_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text())
                pd = data.get("profile", {})
                profile = UserProfile(
                    user_id=pd.get("user_id", ""),
                    name=pd.get("name", ""),
                    cultural_bg=CulturalBackground(pd.get("cultural_bg", "unknown")),
                    phq2_score=pd.get("phq2_score", 0),
                    gad2_score=pd.get("gad2_score", 0),
                    emotion_level=EmotionLevel(pd.get("emotion_level", "mild")),
                    session_turns=pd.get("session_turns", 0),
                    crisis_triggered=pd.get("crisis_triggered", False),
                    tags=pd.get("tags", []),
                )
                session = SessionState(
                    session_id=data["session_id"],
                    profile=profile,
                    current_agent=AgentRole(data.get("current_agent", "triage")),
                    phase=Phase(data.get("phase", "triage")),
                    history=data.get("history", []),
                    counseling_data=data.get("counseling_data", {}),
                    case_formulation=data.get("case_formulation", {}),
                    cultural_analysis=data.get("cultural_analysis", {}),
                    insight_report=data.get("insight_report", {}),
                    training_records=data.get("training_records", []),
                    created_at=data.get("created_at", 0),
                    last_active=data.get("last_active", 0),
                )
                self.sessions[session.session_id] = session
            except Exception:
                continue
