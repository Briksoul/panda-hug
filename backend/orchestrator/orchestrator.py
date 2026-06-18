"""Cognitive Orchestrator V5 — 多智能体协作核心调度"""
from __future__ import annotations
import uuid
import time
import json
from pathlib import Path
from dataclasses import dataclass, field

import asyncio

from agents.base import (
    AgentRole, AgentResponse, UserProfile, EmotionLevel, BearStatus,
    CulturalBackground, Phase, Language, CommunicationMode,
    UCurveStage, SocialRole,
)
from agents.counselor import CounselorAgent
from agents.sensing import SensingAgent
from agents.risk import RiskAgent
from agents.case_formulation import CaseFormulationAgent
from agents.insight_report import InsightReportAgent
from agents.coach import CoachAgent
from knowledge.vector_db import KnowledgeBase

SESSIONS_DIR = Path(__file__).parent.parent / "data" / "sessions"

# V5: 最大对话轮数（死循环预防）
MAX_COUNSELING_TURNS = 15


@dataclass
class SessionState:
    session_id: str = ""
    profile: UserProfile = field(default_factory=UserProfile)
    current_phase: str = "home"
    history: list[dict[str, str]] = field(default_factory=list)
    counseling_data: dict = field(default_factory=dict)
    case_formulation: dict = field(default_factory=dict)
    insight_report: dict = field(default_factory=dict)
    training_records: list[dict] = field(default_factory=list)
    emotion_assessment_done: bool = False
    crisis_override_available: bool = False
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)
    # V5 新增
    social_rehearsal_active: bool = False
    social_rehearsal_role: str = ""
    report_generation_in_progress: bool = False


class CognitiveOrchestrator:
    """V5 系统总控 — 多智能体协作 + U型曲线 + 虚拟社交演练"""

    def __init__(self, knowledge_base: KnowledgeBase | None = None):
        self.sessions: dict[str, SessionState] = {}
        self.kb = knowledge_base or KnowledgeBase()
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

        self.agents = {
            AgentRole.COUNSELOR: CounselorAgent(),
            AgentRole.SENSING: SensingAgent(),
            AgentRole.RISK: RiskAgent(),
            AgentRole.CASE_FORMULATION: CaseFormulationAgent(),
            AgentRole.INSIGHT_REPORT: InsightReportAgent(),
            AgentRole.COACH: CoachAgent(),
        }

        self._load_all_sessions()

    def create_session(self, user_name: str = "", language: str = "zh") -> str:
        sid = str(uuid.uuid4())[:8]
        lang = Language.ZH if language == "zh" else Language.EN
        session = SessionState(
            session_id=sid,
            profile=UserProfile(user_id=sid, name=user_name, language=lang),
        )
        self.sessions[sid] = session
        self._save_session(session)
        return sid

    def get_session(self, session_id: str) -> SessionState | None:
        return self.sessions.get(session_id)

    def navigate_to_phase(self, session_id: str, target_phase: str) -> AgentResponse:
        session = self.sessions.get(session_id)
        if not session:
            return AgentResponse(agent=AgentRole.COGNITIVE_ORCHESTRATOR, content="会话不存在")

        session.current_phase = target_phase
        session.last_active = time.time()
        is_zh = session.profile.language == Language.ZH

        if target_phase == "home":
            content = (is_zh and "回到主页" or "Back to home")
        elif target_phase == "emotion":
            content = (is_zh and "你现在感觉怎么样？" or "How are you feeling?")
        elif target_phase == "counseling":
            content = (is_zh and "选择一种舒服的方式，和Panda聊聊吧" or "Choose a way to chat with Panda")
        elif target_phase == "insight":
            content = (is_zh and "你的心理洞察报告" or "Your Insight Report")
        elif target_phase == "training":
            content = (is_zh and "选择一个放松训练" or "Choose a relaxation exercise")
        else:
            content = ""

        self._save_session(session)
        return AgentResponse(
            agent=AgentRole.COGNITIVE_ORCHESTRATOR,
            content=content,
            metadata={"phase": target_phase},
        )

    async def process_message(self, session_id: str, user_message: str) -> AgentResponse:
        session = self.sessions.get(session_id)
        if not session:
            return AgentResponse(agent=AgentRole.COGNITIVE_ORCHESTRATOR, content="会话不存在")

        session.last_active = time.time()
        profile = session.profile
        profile.session_turns += 1

        phase = session.current_phase

        # 情绪识别阶段
        if phase == "emotion":
            return await self._handle_emotion(session, user_message)

        # 倾诉陪伴阶段
        if phase == "counseling":
            return await self._handle_counseling(session, user_message)

        # 训练阶段
        if phase == "training":
            return await self._handle_training(session, user_message)

        # 默认：直接调用 Counselor
        return await self._handle_counseling(session, user_message)

    async def _handle_emotion(self, session: SessionState, user_message: str) -> AgentResponse:
        profile = session.profile
        is_zh = profile.language == Language.ZH

        # 检测量表回答
        score_map = {
            "完全没有": 0, "好几天": 1, "一半以上天数": 2, "几乎每天": 3,
            "not at all": 0, "several days": 1, "more than half the days": 2, "nearly every day": 3,
        }

        score = None
        for key, val in score_map.items():
            if key in user_message.lower():
                score = val
                break

        if score is not None:
            # 跳过量表
            if "跳过" in user_message or "skip" in user_message.lower():
                session.emotion_assessment_done = True
                profile.bear_status = BearStatus.CALM
                profile.phq2_score = 0
                profile.gad2_score = 0
                # V5: 本地生成小熊状态报告（不调 LLM）
                session.insight_report = self._generate_bear_status_report(profile)
                self._save_session(session)
                return AgentResponse(
                    agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                    content=(is_zh and "没关系，如果觉得测试有压力，我们可以直接聊聊。" or "No worries. If the test feels stressful, we can just chat."),
                    action_links=[{"label": "陪你倾诉" if is_zh else "Confide", "phase": "counseling", "type": "next"}],
                )

            if "assessment_answers" not in session.counseling_data:
                session.counseling_data["assessment_answers"] = []
            session.counseling_data["assessment_answers"].append(score)
            answers = session.counseling_data["assessment_answers"]

            if len(answers) >= 2:
                profile.phq2_score = answers[0] + answers[1]
            if len(answers) >= 4:
                profile.gad2_score = answers[2] + answers[3]
                session.emotion_assessment_done = True

                total = profile.phq2_score + profile.gad2_score
                if total <= 1:
                    profile.bear_status = BearStatus.HAPPY
                elif total <= 3:
                    profile.bear_status = BearStatus.CALM
                else:
                    profile.bear_status = BearStatus.TIRED

                # V5: 本地生成小熊状态报告（不调 LLM，即时响应）
                session.insight_report = self._generate_bear_status_report(profile)

                self._save_session(session)
                return AgentResponse(
                    agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                    content="评估完成",
                    metadata={"assessment_done": True, "bear_status": profile.bear_status.value},
                    action_links=[
                        {"label": "陪你倾诉" if is_zh else "Confide", "phase": "counseling", "type": "next"},
                    ],
                )

            self._save_session(session)
            return AgentResponse(
                agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                content="继续回答",
                metadata={"question_number": len(answers) + 1},
            )

        # 检测情绪选择
        emotion_map = {
            "充满活力": "positive", "还可以": "stable",
            "略显疲惫": "tired", "感到焦虑": "anxious", "感到抑郁": "low",
            "energy high": "positive", "stable": "stable",
            "tired": "tired", "anxious": "anxious", "low": "low",
        }

        for key, val in emotion_map.items():
            if key in user_message.lower():
                if val in ("positive", "stable"):
                    profile.emotion_level = EmotionLevel.POSITIVE
                    profile.bear_status = BearStatus.HAPPY
                    session.emotion_assessment_done = True

                    # V5: 检索心理科普库
                    kb_result = await self.kb.search(
                        "积极心理学 幸福 感恩 情绪调节 心理自我照护",
                        agent_role="cognitive_orchestrator",
                    )
                    science_tip = (
                        "心理健康需要关注日常情绪调节和心理自我照护，这是每个人都可以实践的小技巧。\n\n"
                        "保持积极心态的同时，也别忘了给自己留一些放松和反思的时间。"
                    ) if is_zh else (
                        "Mental health requires daily emotional regulation and self-care. "
                        "These are small practices everyone can do."
                    )
                    if kb_result:
                        science_tip += "\n\n" + kb_result[:200]

                    self._save_session(session)
                    return AgentResponse(
                        agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                        content=science_tip,
                        metadata={"bear_status": "happy", "science_tip": True},
                        action_links=[
                            {"label": "陪你倾诉" if is_zh else "Confide", "phase": "counseling", "type": "next"},
                        ],
                    )
                else:
                    return AgentResponse(
                        agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                        content="开始量表评估",
                        metadata={"start_assessment": True},
                    )

        return AgentResponse(agent=AgentRole.COGNITIVE_ORCHESTRATOR, content="")

    async def _handle_counseling(self, session: SessionState, user_message: str) -> AgentResponse:
        profile = session.profile
        is_zh = profile.language == Language.ZH

        # 后台分析
        sensing_result = await self.agents[AgentRole.SENSING].analyze(user_message, profile)

        # V5: 低置信度时降级处理（置信度 < 40% 时放弃该模态）
        if sensing_result.confidence < 0.4:
            sensing_result.intensity = max(0.1, sensing_result.intensity * 0.5)

        # 危机检测
        if sensing_result.should_trigger_crisis:
            session.crisis_override_available = True
            return AgentResponse(
                agent=AgentRole.RISK,
                content=(is_zh and "我很担心你。请立即寻求专业帮助。\n\n如果你只是在举例或目前很安全，请点击下方按钮。" or "I'm concerned. Please seek help immediately.\n\nIf you were just giving an example or are currently safe, click below."),
                emotion_level=EmotionLevel.CRISIS,
                suggestions=["我只是在举例" if is_zh else "I was just giving an example", "我目前很安全" if is_zh else "I'm currently safe"],
            )

        # V5: 用户澄清危机误判（假阳性逃生通道）
        if getattr(session, 'crisis_override_available', False):
            override_keywords = ["我只是在举例", "我目前很安全", "just giving an example", "currently safe"]
            if any(kw in user_message for kw in override_keywords):
                session.crisis_override_available = False
                profile.crisis_triggered = False
                profile.emotion_level = EmotionLevel.MILD
                self._save_session(session)
                return AgentResponse(
                    agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                    content=(is_zh and "明白了，谢谢你告诉我。我们继续吧。" or "Got it, thank you. Let's continue."),
                    suggestions=["继续聊聊" if is_zh else "Continue"],
                )

        # V5: 检测社交演练请求
        social_role = self._detect_social_rehearsal(user_message, is_zh)
        if social_role and not session.social_rehearsal_active:
            session.social_rehearsal_active = True
            session.social_rehearsal_role = social_role
            profile.social_role = SocialRole(social_role)
            self._save_session(session)
            role_names = {
                "professor": ("教授", "professor"),
                "roommate": ("室友", "roommate"),
                "employer": ("面试官", "interviewer"),
                "friend": ("新朋友", "new friend"),
            }
            zh_name, en_name = role_names.get(social_role, ("TA", "them"))
            return AgentResponse(
                agent=AgentRole.COUNSELOR,
                content=(is_zh
                    and f"好的！我现在扮演你的{zh_name}。你可以试着说出你想对TA说的话，我会以{zh_name}的身份回应你。\n\n随时可以告诉我「结束演练」回到正常聊天。"
                    or f"OK! I'll play your {en_name}. Try saying what you'd like to tell them. I'll respond as your {en_name}.\n\nSay 'end rehearsal' anytime to return to normal chat."),
                suggestions=["结束演练" if is_zh else "End rehearsal"],
            )

        # 检测结束演练
        if session.social_rehearsal_active:
            if any(kw in user_message for kw in ["结束演练", "停止演练", "end rehearsal", "stop rehearsal"]):
                session.social_rehearsal_active = False
                session.social_rehearsal_role = ""
                profile.social_role = SocialRole.NONE
                self._save_session(session)
                return AgentResponse(
                    agent=AgentRole.COUNSELOR,
                    content=(is_zh
                        and "演练结束！你表现得很好。面对真实的社交场景时，你可以用今天练习的方式来表达自己。我们继续聊聊？"
                        or "Rehearsal over! You did great. You can use what you practiced today in real situations. Shall we continue?"),
                )

        # 知识库检索
        kb_context = await self.kb.search(user_message, agent_role="counselor")

        # V5: 如果在社交演练模式，给 counselor 加角色 prompt
        if session.social_rehearsal_active:
            from agents.counselor import SOCIAL_ROLE_PROMPTS
            role = SocialRole(session.social_rehearsal_role)
            if role in SOCIAL_ROLE_PROMPTS:
                kb_context = SOCIAL_ROLE_PROMPTS[role] + "\n\n" + kb_context

        # Counselor 回复
        response = await self.agents[AgentRole.COUNSELOR].chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=kb_context,
        )

        session.history.append({"role": "user", "content": user_message})
        session.history.append({"role": "assistant", "content": response.content})

        # 收集咨询数据
        if response.metadata.get("counseling_data"):
            session.counseling_data.update(response.metadata["counseling_data"])

        # V5: U 型曲线追踪
        self._update_u_curve(session)

        # V5: 计算咨询轮数（死循环预防：最大 15 轮）
        counseling_turns = sum(1 for m in session.history if m["role"] == "user")

        # 后端静默判断是否可以生成报告
        history_text = " ".join(m["content"] for m in session.history if m["role"] == "user")
        can_generate = counseling_turns >= 5 and len(history_text) >= 20

        # V5: 死循环预防 — 超过最大轮数强制生成报告
        force_generate = counseling_turns >= MAX_COUNSELING_TURNS

        if not can_generate and not force_generate:
            response.should_transition = False
            response.next_phase = None
            response.action_links = []
            self._save_session(session)
            return response

        # 达到条件或强制，生成报告
        session.counseling_data["history_text"] = history_text

        try:
            cf = await asyncio.wait_for(
                self.agents[AgentRole.CASE_FORMULATION].build(session.counseling_data, profile),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            from agents.case_formulation import CaseFormulation
            cf = CaseFormulation(completeness=0.3)

        session.case_formulation = {
            "core_event": cf.core_event,
            "core_emotions": cf.core_emotions,
            "auto_thoughts": cf.auto_thoughts,
            "behavior_pattern": cf.behavior_pattern,
            "social_support": cf.social_support,
        }

        try:
            session.insight_report = await asyncio.wait_for(
                self.agents[AgentRole.INSIGHT_REPORT].generate(
                    case_formulation=session.case_formulation,
                    cultural_analysis={},
                    profile=profile,
                    history_text=session.counseling_data.get("history_text", ""),
                ),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            session.insight_report = self.agents[AgentRole.INSIGHT_REPORT]._fallback_report(profile)

        response.should_transition = True
        response.action_links = [
            {"label": "看见自己" if is_zh else "See Yourself", "phase": "insight", "type": "next"},
        ]

        self._save_session(session)
        return response

    async def _handle_training(self, session: SessionState, user_message: str) -> AgentResponse:
        profile = session.profile
        is_zh = profile.language == Language.ZH

        # 检测反馈
        feedback_map = {
            "好很多": "positive", "有一点改善": "positive",
            "没变化": "neutral", "更糟了": "negative",
            "much better": "positive", "some improvement": "positive",
            "no change": "neutral", "worse": "negative",
        }

        for key, val in feedback_map.items():
            if key in user_message.lower():
                session.training_records.append({"feedback": val, "message": user_message})
                # V5: PERMA 能量更新
                self._update_perma_energy(profile, val)
                self._save_session(session)
                return AgentResponse(
                    agent=AgentRole.COACH,
                    content="收到反馈",
                    metadata={"feedback": val, "perma_energy": profile.perma_energy},
                )

        # Coach 回复
        kb_context = await self.kb.search(user_message, agent_role="coach")
        response = await self.agents[AgentRole.COACH].chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=kb_context,
        )

        session.history.append({"role": "user", "content": user_message})
        session.history.append({"role": "assistant", "content": response.content})
        self._save_session(session)
        return response

    # ─── V5 辅助方法 ─────────────────────────────────────

    def _generate_bear_status_report(self, profile: UserProfile) -> dict:
        """V5: 本地生成小熊状态报告（不调 LLM，即时响应）"""
        is_zh = profile.language.value == "zh"
        bear_map = {
            BearStatus.HAPPY: {
                "emoji": "😊",
                "label": "开心小熊" if is_zh else "Happy Bear",
                "description": "当前未发现明显心理情绪风险" if is_zh else "No significant emotional risk detected",
            },
            BearStatus.CALM: {
                "emoji": "🐻",
                "label": "平静小熊" if is_zh else "Calm Bear",
                "description": "存在轻度心理情绪困扰" if is_zh else "Mild emotional distress detected",
            },
            BearStatus.TIRED: {
                "emoji": "🐻‍❄️",
                "label": "疲惫小熊" if is_zh else "Tired Bear",
                "description": "心理情绪风险较高" if is_zh else "Higher emotional risk detected",
            },
        }
        bear = bear_map.get(profile.bear_status, bear_map[BearStatus.CALM])
        return {
            "bear_status": bear,
            "what_happened": {"timeline": [], "summary": ""},
            "why_this_happens": {
                "eastern_view": {"mechanisms": [], "interpretation": ""},
                "western_view": {"mechanisms": [], "interpretation": ""},
                "synthesis": "",
            },
            "what_i_need": {"core_needs": [], "suggestions": []},
            "bear_message": "",
            "u_curve_info": {"stage": profile.u_curve_stage.value, "description": "", "tip": ""},
            "training_recommendation": "",
        }

    def _update_u_curve(self, session: SessionState):
        """V5: 更新 U 型文化适应曲线阶段"""
        profile = session.profile
        months = profile.study_abroad_months

        # 基于留学时长 + 情绪分数的 U 型曲线判断
        total_score = profile.phq2_score + profile.gad2_score

        if months <= 0:
            profile.u_curve_stage = UCurveStage.UNKNOWN
        elif months <= 6:
            # 0-6 个月：蜜月期或危机期
            if total_score >= 4:
                profile.u_curve_stage = UCurveStage.CRISIS
            else:
                profile.u_curve_stage = UCurveStage.HONEYMOON
        elif months <= 18:
            # 6-18 个月：危机期或恢复期
            if total_score >= 4:
                profile.u_curve_stage = UCurveStage.CRISIS
            else:
                profile.u_curve_stage = UCurveStage.RECOVERY
        else:
            # 18+ 个月：恢复期或融入期
            if total_score >= 4:
                profile.u_curve_stage = UCurveStage.RECOVERY
            else:
                profile.u_curve_stage = UCurveStage.INTEGRATION

    def _update_perma_energy(self, profile: UserProfile, feedback: str):
        """V5: 更新 PERMA 能量值"""
        if feedback == "positive":
            profile.perma_energy = min(1.0, profile.perma_energy + 0.15)
        elif feedback == "neutral":
            pass  # 不变
        else:
            profile.perma_energy = max(0.0, profile.perma_energy - 0.1)

    def _detect_social_rehearsal(self, text: str, is_zh: bool) -> str | None:
        """V5: 检测用户是否想进行社交演练"""
        text_lower = text.lower()

        # 直接请求演练
        if any(kw in text_lower for kw in ["演练", "练习一下", "角色扮演", "rehearse", "practice", "role play"]):
            # 识别角色
            if any(kw in text_lower for kw in ["教授", "老师", "professor"]):
                return "professor"
            if any(kw in text_lower for kw in ["室友", "roommate"]):
                return "roommate"
            if any(kw in text_lower for kw in ["面试", "interview", "雇主", "employer", "boss"]):
                return "employer"
            if any(kw in text_lower for kw in ["朋友", "friend"]):
                return "friend"
            return "friend"  # 默认角色

        return None

    def get_state(self, session_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "session not found"}
        return {
            "session_id": session.session_id,
            "current_phase": session.current_phase,
            "profile": {
                "name": session.profile.name,
                "language": session.profile.language.value,
                "cultural_bg": session.profile.cultural_bg.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "bear_status": session.profile.bear_status.value,
                "turns": session.profile.session_turns,
                # V5 新增
                "study_abroad_months": session.profile.study_abroad_months,
                "u_curve_stage": session.profile.u_curve_stage.value,
                "perma_energy": session.profile.perma_energy,
                "social_role": session.profile.social_role.value,
            },
            "insight_report": session.insight_report,
            "training_records": session.training_records,
            "emotion_assessment_done": session.emotion_assessment_done,
            # V5 新增
            "social_rehearsal_active": session.social_rehearsal_active,
            "report_generation_in_progress": session.report_generation_in_progress,
        }

    def _save_session(self, session: SessionState):
        data = {
            "session_id": session.session_id,
            "current_phase": session.current_phase,
            "history": session.history,
            "counseling_data": session.counseling_data,
            "case_formulation": session.case_formulation,
            "insight_report": session.insight_report,
            "training_records": session.training_records,
            "emotion_assessment_done": session.emotion_assessment_done,
            "created_at": session.created_at,
            "last_active": session.last_active,
            "social_rehearsal_active": session.social_rehearsal_active,
            "social_rehearsal_role": session.social_rehearsal_role,
            "profile": {
                "user_id": session.profile.user_id,
                "name": session.profile.name,
                "language": session.profile.language.value,
                "cultural_bg": session.profile.cultural_bg.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "bear_status": session.profile.bear_status.value,
                "session_turns": session.profile.session_turns,
                "tags": session.profile.tags,
                # V5 新增
                "study_abroad_months": session.profile.study_abroad_months,
                "u_curve_stage": session.profile.u_curve_stage.value,
                "perma_energy": session.profile.perma_energy,
                "social_role": session.profile.social_role.value,
                "culture_framework_score": session.profile.culture_framework_score,
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
                    language=Language(pd.get("language", "zh")),
                    cultural_bg=CulturalBackground(pd.get("cultural_bg", "unknown")),
                    phq2_score=pd.get("phq2_score", 0),
                    gad2_score=pd.get("gad2_score", 0),
                    emotion_level=EmotionLevel(pd.get("emotion_level", "mild")),
                    bear_status=BearStatus(pd.get("bear_status", "calm")),
                    session_turns=pd.get("session_turns", 0),
                    tags=pd.get("tags", []),
                    # V5 新增
                    study_abroad_months=pd.get("study_abroad_months", 0),
                    u_curve_stage=UCurveStage(pd.get("u_curve_stage", "unknown")),
                    perma_energy=pd.get("perma_energy", 0.5),
                    social_role=SocialRole(pd.get("social_role", "none")),
                    culture_framework_score=pd.get("culture_framework_score", 0.5),
                )
                session = SessionState(
                    session_id=data["session_id"],
                    profile=profile,
                    current_phase=data.get("current_phase", "home"),
                    history=data.get("history", []),
                    counseling_data=data.get("counseling_data", {}),
                    case_formulation=data.get("case_formulation", {}),
                    insight_report=data.get("insight_report", {}),
                    training_records=data.get("training_records", []),
                    emotion_assessment_done=data.get("emotion_assessment_done", False),
                    created_at=data.get("created_at", 0),
                    last_active=data.get("last_active", 0),
                    social_rehearsal_active=data.get("social_rehearsal_active", False),
                    social_rehearsal_role=data.get("social_rehearsal_role", ""),
                )
                self.sessions[session.session_id] = session
            except Exception:
                continue
