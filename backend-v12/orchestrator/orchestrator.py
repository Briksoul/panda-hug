"""CognitiveOrchestrator — 系统总控协调（V2 升级版）"""
from __future__ import annotations
import asyncio
import uuid
import time
from dataclasses import dataclass, field
from enum import Enum

from agents.base import (
    AdaptationStage,
    AgentRole,
    AgentResponse,
    CulturalBackground,
    CulturalIdentity,
    EmotionLevel,
    UserProfile,
)
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
from agents.memory import MemoryAgent
from database import ChatSessionRecord, session_scope
from knowledge.vector_db import KnowledgeBase


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
    history: list[dict] = field(default_factory=list)
    counseling_data: dict = field(default_factory=dict)
    case_formulation: dict = field(default_factory=dict)
    cultural_analysis: dict = field(default_factory=dict)
    insight_report: dict = field(default_factory=dict)
    report_status: str = "idle"
    latest_supervision: dict = field(default_factory=dict)
    training_records: list[dict] = field(default_factory=list)
    training_baseline: dict = field(default_factory=dict)
    latest_voice_analysis: dict = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)


class CognitiveOrchestrator:
    """系统总控协调 — 管理多智能体协作"""

    def __init__(self, knowledge_base: KnowledgeBase | None = None):
        self.sessions: dict[str, SessionState] = {}
        self.kb = knowledge_base or KnowledgeBase()

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
        self.memory = MemoryAgent()
        self.background_tasks: set[asyncio.Task] = set()

    # ─── 会话管理 ─────────────────────────────────────────────
    def create_session(
        self,
        user_name: str = "",
        user_id: str = "",
        cultural_identity: str = "unknown",
        language: str = "zh",
        study_abroad_months: int = 0,
        phq2_score: int = 0,
        gad2_score: int = 0,
    ) -> str:
        sid = str(uuid.uuid4())
        stable_user_id = user_id.strip() or str(uuid.uuid4())
        memory = self.memory.get_memory(stable_user_id)
        stored_profile = memory.get("profile", {})

        try:
            identity = CulturalIdentity(cultural_identity)
        except ValueError:
            identity = CulturalIdentity.UNKNOWN
        if identity == CulturalIdentity.UNKNOWN:
            try:
                identity = CulturalIdentity(
                    stored_profile.get("cultural_identity", "unknown")
                )
            except ValueError:
                identity = CulturalIdentity.UNKNOWN

        try:
            adaptation_stage = AdaptationStage(
                stored_profile.get("adaptation_stage", "unknown")
            )
        except ValueError:
            adaptation_stage = AdaptationStage.UNKNOWN

        profile = UserProfile(
            user_id=stable_user_id,
            name=user_name or stored_profile.get("name", ""),
            cultural_bg=self._background_for_identity(
                identity,
                stored_profile.get("cultural_bg", "unknown"),
            ),
            cultural_identity=identity,
            adaptation_stage=adaptation_stage,
            memory_summary=memory.get("dynamic_summary", ""),
            language=(
                language if language in ("zh", "en")
                else stored_profile.get("language", "zh")
            ),
            study_abroad_months=max(
                0,
                min(
                    600,
                    study_abroad_months
                    if study_abroad_months >= 0
                    else stored_profile.get("study_abroad_months", 0),
                ),
            ),
            phq2_score=max(0, min(6, phq2_score)),
            gad2_score=max(0, min(6, gad2_score)),
            emotion_level=self._emotion_level_from_scores(
                phq2_score,
                gad2_score,
            ),
        )
        session = SessionState(
            session_id=sid,
            profile=profile,
        )
        self.sessions[sid] = session
        updated_memory = self.memory.register_session(profile, sid)
        profile.memory_summary = updated_memory.get("dynamic_summary", "")
        self._save_session(session)
        return sid

    def get_session(self, session_id: str) -> SessionState | None:
        with session_scope() as database:
            record = database.get(ChatSessionRecord, session_id)
            if record is None:
                self.sessions.pop(session_id, None)
                return None
            session = self._session_from_data(record.state)
            self.sessions[session_id] = session
            return session

    def get_user_memory(self, user_id: str) -> dict:
        return self.memory.get_memory(user_id)

    def get_user_growth(self, user_id: str) -> dict:
        return self.memory.get_growth_record(user_id)

    @staticmethod
    def _emotion_level_from_scores(
        phq2_score: int,
        gad2_score: int,
    ) -> EmotionLevel:
        maximum = max(phq2_score, gad2_score)
        if maximum <= 1:
            return EmotionLevel.POSITIVE
        if maximum <= 3:
            return EmotionLevel.MILD
        return EmotionLevel.MODERATE

    def record_self_guided_training(
        self,
        session_id: str,
        training_record: dict,
    ) -> dict | None:
        session = self.get_session(session_id)
        if not session:
            return None
        record = {
            **training_record,
            "completed_at": training_record.get("completed_at", time.time()),
            "source": "self_guided",
        }
        session.training_records.append(record)
        memory = self.memory.record_training(
            session.profile,
            session_id,
            record,
        )
        session.profile.memory_summary = memory.get("dynamic_summary", "")
        session.last_active = time.time()
        self._save_session(session)
        return record

    async def record_voice_analysis(
        self,
        session_id: str,
        transcript: str,
        emotion_scores: dict[str, float],
    ) -> dict | None:
        session = self.get_session(session_id)
        if not session:
            return None

        text_result = await self.sensing.analyze(transcript, session.profile)
        fused_result, acoustic_analysis = self.sensing.fuse_voice_analysis(
            text_result,
            emotion_scores,
        )
        sensing = {
            "sentiment": fused_result.sentiment,
            "emotion_tags": fused_result.emotion_tags,
            "intensity": fused_result.intensity,
            "source": "voice",
        }
        record = {
            "timestamp": time.time(),
            "transcript": transcript[:1000],
            "sensing": sensing,
            "requires_immediate_support": text_result.should_trigger_crisis,
            **acoustic_analysis,
        }
        session.latest_voice_analysis = record
        session.last_active = time.time()
        memory = self.memory.record_voice_analysis(
            profile=session.profile,
            session_id=session_id,
            transcript=transcript,
            sensing=sensing,
            analysis=record,
        )
        session.profile.memory_summary = memory.get("dynamic_summary", "")
        self._save_session(session)
        return record

    def record_guardrail_crisis(
        self,
        session_id: str,
        user_message: str,
        response_content: str,
        input_mode: str = "text",
    ) -> None:
        session = self.get_session(session_id)
        if not session:
            return

        session.last_active = time.time()
        session.profile.session_turns += 1
        session.profile.emotion_level = EmotionLevel.CRISIS
        session.profile.crisis_triggered = True
        self._transition(session, AgentRole.CRISIS)
        session.history.append({"role": "user", "content": user_message})
        session.history.append({
            "role": "assistant",
            "content": response_content,
            "agent": AgentRole.CRISIS.value,
        })
        memory = self.memory.record_turn(
            profile=session.profile,
            session_id=session_id,
            user_message=user_message,
            assistant_response=response_content,
            agent=AgentRole.CRISIS.value,
            sensing={
                "sentiment": "negative",
                "emotion_tags": ["crisis"],
                "intensity": 1.0,
                "source": input_mode,
            },
        )
        session.profile.memory_summary = memory.get("dynamic_summary", "")
        self._save_session(session)

    # ─── 核心处理流程 ──────────────────────────────────────────
    async def process_message(
        self,
        session_id: str,
        user_message: str,
        input_mode: str = "text",
        risk_hint: str = "",
        voice_emotion_scores: dict[str, float] | None = None,
        on_text_chunk=None,
    ) -> AgentResponse:
        session = self.get_session(session_id)
        if not session:
            return AgentResponse(
                agent=AgentRole.TRIAGE,
                content="会话不存在，请重新开始。",
            )

        session.last_active = time.time()
        profile = session.profile
        profile.session_turns += 1
        agent_trace = []
        request_started = time.perf_counter()
        step_started = request_started
        timings_ms = {}

        # ─── Step 1: Sensing Agent（后台情感分析）───
        agent_trace.append({
            "agent": "sensing", "status": "analyzing",
            "label": (
                "Sensing Agent 文本与声学融合分析..."
                if voice_emotion_scores
                else "Sensing Agent 文本情绪分析..."
            ),
        })
        sensing_result = await self.sensing.analyze(user_message, profile)
        acoustic_analysis = {}
        if voice_emotion_scores:
            sensing_result, acoustic_analysis = self.sensing.fuse_voice_analysis(
                sensing_result,
                voice_emotion_scores,
            )
        timings_ms["sensing"] = round(
            (time.perf_counter() - step_started) * 1000
        )
        emotion_snapshot = self._emotion_snapshot(sensing_result, input_mode)
        agent_trace[-1]["status"] = "done"
        agent_trace[-1]["detail"] = f"情感={sensing_result.sentiment}, 强度={sensing_result.intensity:.1f}"

        # ─── Step 2: Risk Agent（后台危机监测）───
        agent_trace.append({
            "agent": "risk", "status": "scanning",
            "label": "Risk Agent 危机风险扫描...",
        })
        risk_result = {"risk_level": 0, "action": "continue"}
        step_started = time.perf_counter()
        if sensing_result.should_trigger_crisis:
            risk_result = {
                "risk_level": 4,
                "action": "crisis",
                "concerning_signals": sensing_result.crisis_keywords,
            }
        elif risk_hint == "high":
            risk_result = await self.risk.quick_check(user_message, profile)
        agent_trace[-1]["status"] = "done"
        agent_trace[-1]["detail"] = f"风险等级={risk_result.get('risk_level', 0)}"
        timings_ms["risk"] = round(
            (time.perf_counter() - step_started) * 1000
        )

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
        step_started = time.perf_counter()
        if session.current_agent in (
            AgentRole.CULTURAL,
            AgentRole.COACH,
            AgentRole.COUNSELOR,
            AgentRole.CRISIS,
        ):
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
        if acoustic_analysis:
            voice_context = self._voice_context(acoustic_analysis)
            knowledge_ctx = "\n\n".join(
                part for part in (knowledge_ctx, voice_context) if part
            )
        timings_ms["knowledge"] = round(
            (time.perf_counter() - step_started) * 1000
        )

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
        active_trace_index = len(agent_trace) - 1

        active_agent = session.current_agent
        agent = self.agents.get(active_agent)
        if not agent:
            agent = self.agents[AgentRole.TRIAGE]

        session.history.append({"role": "user", "content": user_message})

        step_started = time.perf_counter()
        first_visible_text_ms = None

        async def forward_text_chunk(text: str):
            nonlocal first_visible_text_ms
            if first_visible_text_ms is None:
                first_visible_text_ms = round(
                    (time.perf_counter() - request_started) * 1000
                )
            result = on_text_chunk(text)
            if hasattr(result, "__await__"):
                await result

        agent_task = asyncio.create_task(agent.chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=knowledge_ctx,
            on_text_chunk=forward_text_chunk if on_text_chunk else None,
        ))
        case_task = None
        case_trace_index = None
        if (
            active_agent == AgentRole.CULTURAL
            and session.counseling_data
            and not session.case_formulation
        ):
            agent_trace.append({
                "agent": "case_formulation",
                "status": "building",
                "label": "CaseFormulation 构建心理模型...",
            })
            case_trace_index = len(agent_trace) - 1
            case_task = asyncio.create_task(
                self.case_formulation.build(session.counseling_data, profile)
            )

        response = await agent_task
        agent_trace[active_trace_index]["status"] = "done"

        # ─── Step 5: Supervisor Agent（后台质量监控，仅 Counseling 阶段）───
        if active_agent == AgentRole.COUNSELOR and not response.should_transition:
            agent_trace.append({
                "agent": "supervisor", "status": "scheduled",
                "label": "Supervisor Agent 已进入后台督导...",
            })
            self._schedule_background(
                self._run_supervision(
                    session_id=session_id,
                    counselor_response=response.content,
                    user_message=user_message,
                    history=list(session.history),
                    profile=profile,
                )
            )

        # ─── Step 6: Collect counseling data and parallel case formulation ───
        if active_agent == AgentRole.COUNSELOR and response.metadata.get("counseling_data"):
            session.counseling_data.update(response.metadata["counseling_data"])
        if (
            active_agent == AgentRole.COUNSELOR
            and session.report_status == "idle"
            and not session.insight_report
        ):
            session.report_status = "generating"
            self._schedule_background(
                self._build_case_and_generate_report(session_id)
            )

        if case_task:
            cf = await case_task
            session.case_formulation = {
                "core_event": cf.core_event,
                "core_emotions": cf.core_emotions,
                "auto_thoughts": cf.auto_thoughts,
                "behavior_pattern": cf.behavior_pattern,
                "social_support": cf.social_support,
                "psychological_mechanisms": cf.psychological_mechanisms,
                "mechanism_chain": cf.mechanism_chain,
                "risk_level": cf.risk_level,
                "completeness": cf.completeness,
                "model": cf.model,
            }
            agent_trace[case_trace_index]["status"] = "done"
            agent_trace[case_trace_index]["detail"] = f"模型={cf.model}"
        timings_ms["foreground_agents"] = round(
            (time.perf_counter() - step_started) * 1000
        )

        if active_agent == AgentRole.CULTURAL:
            cultural_data = {
                "core_issue": response.metadata.get("core_issue", ""),
                "cultural_insight": response.metadata.get("cultural_insight", ""),
                "adaptation_stage": response.metadata.get("adaptation_stage", ""),
            }
            session.cultural_analysis.update({
                key: value for key, value in cultural_data.items() if value
            })

        training_record = None
        if active_agent == AgentRole.COACH and response.metadata.get("technique"):
            before_snapshot = session.training_baseline or emotion_snapshot
            training_record = {
                "technique": response.metadata.get("technique", ""),
                "user_feedback": response.metadata.get("user_feedback", ""),
                "improvement": response.metadata.get("improvement", ""),
                "before": before_snapshot,
                "after": emotion_snapshot,
                "distress_change": round(
                    before_snapshot.get("distress_index", 0)
                    - emotion_snapshot.get("distress_index", 0),
                    1,
                ),
                "completed_at": time.time(),
            }
            session.training_records.append(training_record)
            session.training_baseline = {}

        # 记录 Agent 回复
        session.history.append({
            "role": "assistant",
            "content": response.content,
            "agent": response.agent.value,
        })

        # ─── Step 7: 状态转移 ───
        if response.should_transition and response.next_agent:
            if response.next_agent == AgentRole.COACH:
                session.training_baseline = emotion_snapshot
                agent_trace.append({
                    "agent": "insight_report",
                    "status": "training_pending",
                    "label": "训练建议将在洞察报告中呈现",
                })
                self._transition(session, AgentRole.COUNSELOR)
            else:
                agent_trace.append({
                    "agent": response.next_agent.value,
                    "status": "transition",
                    "label": f"切换 → {agent_labels.get(response.next_agent, '')}",
                })
                self._transition(session, response.next_agent)
            if active_agent == AgentRole.COACH and training_record:
                session.phase = Phase.FOLLOW_UP

        # Generate the report in the background after cultural analysis.
        if (response.agent == AgentRole.CULTURAL
                and response.metadata.get("analysis_complete")
                and session.case_formulation
                and session.report_status != "generating"):
            session.report_status = "generating"
            agent_trace.append({
                "agent": "insight_report", "status": "scheduled",
                "label": "InsightReport 已进入后台生成...",
            })
            self._schedule_background(
                self._generate_insight_report(session_id)
            )

        # 补充元数据
        response.metadata["sensing"] = {
            "sentiment": sensing_result.sentiment,
            "emotion_tags": sensing_result.emotion_tags,
            "intensity": sensing_result.intensity,
            "source": input_mode,
        }
        if acoustic_analysis:
            response.metadata["sensing"]["voice_analysis"] = acoustic_analysis
            session.latest_voice_analysis = {
                "timestamp": time.time(),
                "transcript": user_message[:1000],
                "sensing": dict(response.metadata["sensing"]),
                **acoustic_analysis,
            }
        agent_trace.append({
            "agent": "memory",
            "status": "saving",
            "label": "Memory Agent 更新长期记忆...",
        })
        memory = self.memory.record_turn(
            profile=profile,
            session_id=session_id,
            user_message=user_message,
            assistant_response=response.content,
            agent=response.agent.value,
            sensing=response.metadata["sensing"],
            case_formulation=session.case_formulation,
            cultural_analysis=session.cultural_analysis,
            insight_report=session.insight_report,
            training_record=training_record,
        )
        profile.memory_summary = memory.get("dynamic_summary", "")
        agent_trace[-1]["status"] = "done"
        agent_trace[-1]["detail"] = f"累计 {len(memory.get('sessions', []))} 次会话"

        response.metadata["session_id"] = session_id
        response.metadata["turn"] = profile.session_turns
        response.metadata["agent_trace"] = agent_trace
        response.metadata["phase"] = session.phase.value
        if first_visible_text_ms is not None:
            timings_ms["first_visible_text"] = first_visible_text_ms
        response.metadata["latency_ms"] = {
            **timings_ms,
            "total": round((time.perf_counter() - request_started) * 1000),
        }

        # 持久化
        self._save_session(session)
        return response

    def _schedule_background(self, coroutine):
        task = asyncio.create_task(coroutine)
        self.background_tasks.add(task)
        task.add_done_callback(self._background_done)

    def _background_done(self, task: asyncio.Task):
        self.background_tasks.discard(task)
        if not task.cancelled():
            task.exception()

    async def _run_supervision(
        self,
        session_id: str,
        counselor_response: str,
        user_message: str,
        history: list[dict],
        profile: UserProfile,
    ):
        result = await self.supervisor.evaluate(
            counselor_response=counselor_response,
            user_message=user_message,
            history=history,
            profile=profile,
        )
        session = self.get_session(session_id)
        if session:
            session.latest_supervision = result
            self._save_session(session)

    async def _build_case_and_generate_report(self, session_id: str):
        session = self.get_session(session_id)
        if not session:
            return
        try:
            source = dict(session.counseling_data)
            if not source:
                source["recent_history"] = session.history[-6:]
            formulation = await self.case_formulation.build(
                source,
                session.profile,
            )
            session.case_formulation = {
                "core_event": formulation.core_event,
                "core_emotions": formulation.core_emotions,
                "auto_thoughts": formulation.auto_thoughts,
                "behavior_pattern": formulation.behavior_pattern,
                "social_support": formulation.social_support,
                "psychological_mechanisms": formulation.psychological_mechanisms,
                "mechanism_chain": formulation.mechanism_chain,
                "risk_level": formulation.risk_level,
                "completeness": formulation.completeness,
                "model": formulation.model,
            }
            self._save_session(session)
            await self._generate_insight_report(session_id)
        except Exception:
            session.report_status = "error"
            self._save_session(session)

    async def _generate_insight_report(self, session_id: str):
        session = self.get_session(session_id)
        if not session:
            return
        try:
            report = await self.insight_report.generate(
                case_formulation=dict(session.case_formulation),
                cultural_analysis=dict(session.cultural_analysis),
                profile=session.profile,
            )
            session.insight_report = report
            session.report_status = "ready"
            memory = self.memory.record_report(
                session.profile,
                session_id,
                report,
            )
            session.profile.memory_summary = memory.get(
                "dynamic_summary",
                session.profile.memory_summary,
            )
        except Exception:
            session.report_status = "error"
        self._save_session(session)

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

    @staticmethod
    def _training_recommendation(profile: UserProfile) -> dict:
        if profile.gad2_score >= 4:
            return {
                "id": "physiological_sigh",
                "name": "生理叹息",
                "duration_seconds": 120,
                "reason": "通过双重吸气与缓慢呼气，帮助身体降低当前较明显的紧张感。",
            }
        if profile.gad2_score >= 2:
            return {
                "id": "sensory_grounding",
                "name": "感官着陆",
                "duration_seconds": 180,
                "reason": "借助身边的感官线索，把注意力从担忧带回当下。",
            }
        if profile.phq2_score >= 4:
            return {
                "id": "micro_behavioral_activation",
                "name": "微行为激活",
                "duration_seconds": 300,
                "reason": "从一个足够小的行动开始，为低落状态重新建立动力。",
            }
        if profile.phq2_score >= 2:
            return {
                "id": "connection_recall",
                "name": "联结感回溯",
                "duration_seconds": 240,
                "reason": "回忆被支持和理解的时刻，重新感受稳定的情感联结。",
            }
        return {
            "id": "body_scan",
            "name": "身体扫描",
            "duration_seconds": 300,
            "reason": "温和觉察身体各部位的感受，帮助释放累积的紧绷。",
        }

    @staticmethod
    def _emotion_snapshot(sensing_result, source: str = "text") -> dict:
        intensity = max(0.0, min(1.0, float(sensing_result.intensity)))
        if sensing_result.sentiment == "negative":
            distress_index = 45 + intensity * 55
        elif sensing_result.sentiment == "positive":
            distress_index = 20 - intensity * 15
        else:
            distress_index = 25 + intensity * 25
        return {
            "captured_at": time.time(),
            "sentiment": sensing_result.sentiment,
            "emotion_tags": sensing_result.emotion_tags,
            "intensity": intensity,
            "distress_index": round(
                max(0.0, min(100.0, distress_index)),
                1,
            ),
            "source": source,
        }

    @staticmethod
    def _voice_context(analysis: dict) -> str:
        top_emotions = "、".join(
            f"{item.get('label', item.get('name', ''))}"
            f"({float(item.get('score', 0)):.2f})"
            for item in analysis.get("top_emotions", [])[:3]
        )
        signals = analysis.get("psychological_signals", {})
        signal_text = "，".join(
            f"{name}={float(value):.2f}"
            for name, value in signals.items()
        )
        incongruent = (
            "文本与声学表达方向存在差异，应通过开放式提问继续了解。"
            if analysis.get("text_voice_incongruent")
            else ""
        )
        return (
            "辅助声学表达信息（仅作对话线索，不构成诊断或危机判定）："
            f"主要表达={top_emotions or '无明确主导情绪'}；"
            f"趋势信号={signal_text or '无'}。{incongruent}"
        )

    @staticmethod
    def _background_for_identity(
        identity: CulturalIdentity,
        fallback: str = "unknown",
    ) -> CulturalBackground:
        identity_map = {
            CulturalIdentity.CHINESE_IN_US: CulturalBackground.ABROAD,
            CulturalIdentity.AMERICAN_IN_CHINA: CulturalBackground.CHINA,
        }
        if identity in identity_map:
            return identity_map[identity]
        try:
            return CulturalBackground(fallback)
        except ValueError:
            return CulturalBackground.UNKNOWN

    def force_transition(self, session_id: str, agent_role: AgentRole):
        session = self.get_session(session_id)
        if session:
            self._transition(session, agent_role)
            session.last_active = time.time()
            self._save_session(session)

    def get_state(self, session_id: str) -> dict:
        session = self.get_session(session_id)
        if not session:
            return {"error": "session not found"}
        training_recommendation = self._training_recommendation(session.profile)
        training_recommendation["before_distress"] = round(
            max(session.profile.phq2_score, session.profile.gad2_score)
            / 6
            * 10
        )
        return {
            "session_id": session.session_id,
            "current_agent": session.current_agent.value,
            "phase": session.phase.value,
            "profile": {
                "user_id": session.profile.user_id,
                "name": session.profile.name,
                "cultural_bg": session.profile.cultural_bg.value,
                "cultural_identity": session.profile.cultural_identity.value,
                "adaptation_stage": session.profile.adaptation_stage.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "turns": session.profile.session_turns,
                "crisis_triggered": session.profile.crisis_triggered,
                "language": session.profile.language,
                "study_abroad_months": session.profile.study_abroad_months,
            },
            "insight_report": session.insight_report,
            "report_status": session.report_status,
            "latest_supervision": session.latest_supervision,
            "training_records": session.training_records,
            "training_baseline": session.training_baseline,
            "latest_voice_analysis": session.latest_voice_analysis,
            "training_recommendation": training_recommendation,
        }

    # ─── 持久化 ─────────────────────────────────────────────
    def _save_session(self, session: SessionState):
        data = self._session_to_data(session)
        with session_scope() as database:
            record = database.get(ChatSessionRecord, session.session_id)
            if record is None:
                database.add(ChatSessionRecord(
                    id=session.session_id,
                    user_id=session.profile.user_id,
                    state=data,
                    created_at=session.created_at,
                    last_active=session.last_active,
                ))
            else:
                record.user_id = session.profile.user_id
                record.state = data
                record.last_active = session.last_active
        self.sessions[session.session_id] = session

    @staticmethod
    def _session_to_data(session: SessionState) -> dict:
        return {
            "session_id": session.session_id,
            "current_agent": session.current_agent.value,
            "phase": session.phase.value,
            "history": session.history,
            "counseling_data": session.counseling_data,
            "case_formulation": session.case_formulation,
            "cultural_analysis": session.cultural_analysis,
            "insight_report": session.insight_report,
            "report_status": session.report_status,
            "latest_supervision": session.latest_supervision,
            "training_records": session.training_records,
            "training_baseline": session.training_baseline,
            "latest_voice_analysis": session.latest_voice_analysis,
            "created_at": session.created_at,
            "last_active": session.last_active,
            "profile": {
                "user_id": session.profile.user_id,
                "name": session.profile.name,
                "cultural_bg": session.profile.cultural_bg.value,
                "cultural_identity": session.profile.cultural_identity.value,
                "adaptation_stage": session.profile.adaptation_stage.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "session_turns": session.profile.session_turns,
                "crisis_triggered": session.profile.crisis_triggered,
                "tags": session.profile.tags,
                "memory_summary": session.profile.memory_summary,
                "language": session.profile.language,
                "study_abroad_months": session.profile.study_abroad_months,
            },
        }

    @staticmethod
    def _session_from_data(data: dict) -> SessionState:
        profile_data = data.get("profile", {})
        profile = UserProfile(
            user_id=profile_data.get("user_id", ""),
            name=profile_data.get("name", ""),
            cultural_bg=CulturalBackground(
                profile_data.get("cultural_bg", "unknown")
            ),
            cultural_identity=CulturalIdentity(
                profile_data.get("cultural_identity", "unknown")
            ),
            adaptation_stage=AdaptationStage(
                profile_data.get("adaptation_stage", "unknown")
            ),
            phq2_score=profile_data.get("phq2_score", 0),
            gad2_score=profile_data.get("gad2_score", 0),
            emotion_level=EmotionLevel(
                profile_data.get("emotion_level", "mild")
            ),
            session_turns=profile_data.get("session_turns", 0),
            crisis_triggered=profile_data.get("crisis_triggered", False),
            tags=profile_data.get("tags", []),
            memory_summary=profile_data.get("memory_summary", ""),
            language=profile_data.get("language", "zh"),
            study_abroad_months=profile_data.get(
                "study_abroad_months",
                0,
            ),
        )
        return SessionState(
            session_id=data["session_id"],
            profile=profile,
            current_agent=AgentRole(data.get("current_agent", "triage")),
            phase=Phase(data.get("phase", "triage")),
            history=data.get("history", []),
            counseling_data=data.get("counseling_data", {}),
            case_formulation=data.get("case_formulation", {}),
            cultural_analysis=data.get("cultural_analysis", {}),
            insight_report=data.get("insight_report", {}),
            report_status=(
                "error"
                if data.get("report_status") == "generating"
                else data.get("report_status", "idle")
            ),
            latest_supervision=data.get("latest_supervision", {}),
            training_records=data.get("training_records", []),
            training_baseline=data.get("training_baseline", {}),
            latest_voice_analysis=data.get("latest_voice_analysis", {}),
            created_at=data.get("created_at", 0),
            last_active=data.get("last_active", 0),
        )
