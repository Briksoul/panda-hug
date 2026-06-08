"""Cognitive Orchestrator V4 — 系统总控协调"""
from __future__ import annotations
import uuid
import time
import json
from pathlib import Path
from dataclasses import dataclass, field

from agents.base import (
    AgentRole, AgentResponse, UserProfile, EmotionLevel, BearStatus,
    CulturalBackground, Phase, Language, CommunicationMode,
)
from agents.counselor import CounselorAgent
from agents.sensing import SensingAgent
from agents.risk import RiskAgent
from agents.case_formulation import CaseFormulationAgent
from agents.insight_report import InsightReportAgent
from agents.coach import CoachAgent
from knowledge.vector_db import KnowledgeBase

SESSIONS_DIR = Path(__file__).parent.parent / "data" / "sessions"


@dataclass
class SessionState:
    """会话状态"""
    session_id: str = ""
    profile: UserProfile = field(default_factory=UserProfile)
    current_phase: Phase = Phase.HOME
    current_agent: AgentRole = AgentRole.COGNITIVE_ORCHESTRATOR
    history: list[dict[str, str]] = field(default_factory=list)
    counseling_data: dict = field(default_factory=dict)
    case_formulation: dict = field(default_factory=dict)
    insight_report: dict = field(default_factory=dict)
    training_records: list[dict] = field(default_factory=list)
    emotion_assessment_done: bool = False
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)


class CognitiveOrchestrator:
    """V4 系统总控协调 — 管理4阶段流程 + 7智能体协作"""

    def __init__(self, knowledge_base: KnowledgeBase | None = None):
        self.sessions: dict[str, SessionState] = {}
        self.kb = knowledge_base or KnowledgeBase()
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

        # 初始化 Agent
        self.agents = {
            AgentRole.COUNSELOR: CounselorAgent(),
            AgentRole.SENSING: SensingAgent(),
            AgentRole.RISK: RiskAgent(),
            AgentRole.CASE_FORMULATION: CaseFormulationAgent(),
            AgentRole.INSIGHT_REPORT: InsightReportAgent(),
            AgentRole.COACH: CoachAgent(),
        }

        # 启动时加载已有会话
        self._load_all_sessions()

    # ─── 会话管理 ─────────────────────────────────────────────
    def create_session(self, user_name: str = "", language: str = "zh") -> str:
        sid = str(uuid.uuid4())[:8]
        lang = Language.ZH if language == "zh" else Language.EN
        session = SessionState(
            session_id=sid,
            profile=UserProfile(user_id=sid, name=user_name, language=lang),
            current_phase=Phase.HOME,
        )
        self.sessions[sid] = session
        self._save_session(session)
        return sid

    def get_session(self, session_id: str) -> SessionState | None:
        return self.sessions.get(session_id)

    # ─── 阶段导航 ─────────────────────────────────────────────
    def navigate_to_phase(self, session_id: str, target_phase: str) -> AgentResponse:
        """导航到指定阶段（主页按钮或超链接跳转）"""
        session = self.sessions.get(session_id)
        if not session:
            return AgentResponse(agent=AgentRole.COGNITIVE_ORCHESTRATOR, content="会话不存在")

        try:
            phase = Phase(target_phase)
        except ValueError:
            return AgentResponse(agent=AgentRole.COGNITIVE_ORCHESTRATOR, content="无效的阶段")

        session.current_phase = phase
        session.last_active = time.time()

        # 根据目标阶段生成响应
        return self._get_phase_response(session, phase)

    def _get_phase_response(self, session: SessionState, phase: Phase) -> AgentResponse:
        """获取阶段初始响应"""
        lang = session.profile.language
        is_zh = lang == Language.ZH

        if phase == Phase.HOME:
            return self._home_response(session)
        elif phase == Phase.EMOTION_CHECK:
            return self._emotion_check_response(session)
        elif phase == Phase.COUNSELING:
            return self._counseling_start_response(session)
        elif phase == Phase.INSIGHT:
            return self._insight_response(session)
        elif phase == Phase.COACHING:
            return self._coaching_response(session)
        else:
            return self._home_response(session)

    def _home_response(self, session: SessionState) -> AgentResponse:
        """首页响应"""
        is_zh = session.profile.language == Language.ZH
        content = (
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

        return AgentResponse(
            agent=AgentRole.COGNITIVE_ORCHESTRATOR,
            content=content,
            suggestions=["开始", "Start"] if is_zh else ["Start", "Begin"],
            action_links=[
                {"label": "懂你情绪" if is_zh else "Understand Emotions", "phase": "emotion_check", "type": "next"},
            ],
        )

    def _emotion_check_response(self, session: SessionState) -> AgentResponse:
        """阶段1：懂你情绪 — 情绪选择界面"""
        is_zh = session.profile.language == Language.ZH
        name = session.profile.name

        # 根据时间选择问候
        import datetime
        hour = datetime.datetime.now().hour
        if hour < 12:
            greeting = "早上好" if is_zh else "Good morning"
        elif hour < 18:
            greeting = "下午好" if is_zh else "Good afternoon"
        else:
            greeting = "晚上好" if is_zh else "Good evening"

        name_part = f"，{name}" if name else ""
        content = f"{greeting}{name_part}！\n\n" + (
            "你现在感觉怎么样？"
        ) if is_zh else f"{greeting}{name_part}!\n\nHow are you feeling right now?"

        session.current_agent = AgentRole.COGNITIVE_ORCHESTRATOR
        session.current_phase = Phase.EMOTION_CHECK

        return AgentResponse(
            agent=AgentRole.COGNITIVE_ORCHESTRATOR,
            content=content,
            suggestions=(
                ["☀️ 充满活力", "🌤 还可以", "😔 略显疲惫", "😰 感到焦虑", "😢 感到抑郁"]
                if is_zh else
                ["☀️ Full of energy", "🌤 Not bad", "😔 A bit tired", "😰 Anxious", "😢 Feeling down"]
            ),
            action_links=[
                {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
            ],
        )

    def _counseling_start_response(self, session: SessionState) -> AgentResponse:
        """阶段2：陪你倾诉 — 选择沟通方式"""
        is_zh = session.profile.language == Language.ZH
        session.current_phase = Phase.COUNSELING

        content = (
            "选择一种舒服的方式，和Panda聊聊吧"
        ) if is_zh else "Choose a comfortable way to chat with Panda"

        return AgentResponse(
            agent=AgentRole.COGNITIVE_ORCHESTRATOR,
            content=content,
            suggestions=(
                ["💬 文字咨询", "🎤 语音咨询", "📹 视频咨询"]
                if is_zh else
                ["💬 Text Chat", "🎤 Voice Chat", "📹 Video Chat"]
            ),
            action_links=[
                {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                {"label": "懂你情绪" if is_zh else "Emotion Check", "phase": "emotion_check", "type": "prev"},
            ],
        )

    def _insight_response(self, session: SessionState) -> AgentResponse:
        """阶段3：看见自己 — 心理洞察报告"""
        is_zh = session.profile.language == Language.ZH
        session.current_phase = Phase.INSIGHT

        if not session.insight_report:
            # 需要先生成报告
            content = (
                "正在为你生成专属的心理洞察报告..."
            ) if is_zh else "Generating your personalized insight report..."
        else:
            content = (
                "这是你的心理洞察报告。点击「一起练习」，体验融合东西方心理智慧的放松训练。"
            ) if is_zh else "Here's your insight report. Click 'Practice Together' for relaxation training."

        return AgentResponse(
            agent=AgentRole.INSIGHT_REPORT,
            content=content,
            metadata={"insight_report": session.insight_report},
            action_links=[
                {"label": "一起练习" if is_zh else "Practice Together", "phase": "coaching", "type": "next"},
                {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                {"label": "陪你倾诉" if is_zh else "Talk More", "phase": "counseling", "type": "prev"},
            ],
        )

    def _coaching_response(self, session: SessionState) -> AgentResponse:
        """阶段4：一起练习"""
        is_zh = session.profile.language == Language.ZH
        session.current_phase = Phase.COACHING

        content = (
            "现在，是时候照顾一下自己了。\n\n"
            "选择一个放松训练，帮助自己舒缓压力、调整状态。"
        ) if is_zh else (
            "Now it's time to take care of yourself.\n\n"
            "Choose a relaxation exercise to help relieve stress."
        )

        return AgentResponse(
            agent=AgentRole.COACH,
            content=content,
            suggestions=(
                ["🧘 呼吸训练", "🧠 正念冥想", "🎵 音乐放松", "🤸 东方动作"]
                if is_zh else
                ["🧘 Breathing", "🧠 Mindfulness", "🎵 Music", "🤸 Movement"]
            ),
            action_links=[
                {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                {"label": "看见自己" if is_zh else "See Myself", "phase": "insight", "type": "prev"},
            ],
        )

    # ─── 核心处理流程 ──────────────────────────────────────────
    async def process_message(self, session_id: str, user_message: str) -> AgentResponse:
        session = self.sessions.get(session_id)
        if not session:
            return AgentResponse(
                agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                content="会话不存在，请重新开始。",
            )

        session.last_active = time.time()
        profile = session.profile
        profile.session_turns += 1
        agent_trace = []

        # ─── 首页：自动进入阶段1 ───
        if session.current_phase == Phase.HOME:
            session.current_phase = Phase.EMOTION_CHECK
            return self._emotion_check_response(session)

        # ─── 阶段1：懂你情绪 ───
        if session.current_phase == Phase.EMOTION_CHECK:
            return await self._handle_emotion_check(session, user_message, agent_trace)

        # ─── 阶段2：陪你倾诉 ───
        if session.current_phase == Phase.COUNSELING:
            return await self._handle_counseling(session, user_message, agent_trace)

        # ─── 阶段4：一起练习 ───
        if session.current_phase == Phase.COACHING:
            return await self._handle_coaching(session, user_message, agent_trace)

        # 默认：回到主页
        return self._home_response(session)

    async def _handle_emotion_check(
        self, session: SessionState, user_message: str, agent_trace: list
    ) -> AgentResponse:
        """处理阶段1：懂你情绪"""
        profile = session.profile
        is_zh = profile.language == Language.ZH

        # 检测情绪选择
        emotion_map_zh = {
            "充满活力": "positive", "还可以": "positive",
            "略显疲惫": "mild", "感到焦虑": "moderate", "感到抑郁": "severe",
        }
        emotion_map_en = {
            "full of energy": "positive", "not bad": "positive",
            "a bit tired": "mild", "anxious": "moderate", "feeling down": "severe",
        }

        detected_emotion = None
        user_lower = user_message.lower()
        for key, val in emotion_map_zh.items():
            if key in user_message:
                detected_emotion = val
                break
        if not detected_emotion:
            for key, val in emotion_map_en.items():
                if key in user_lower:
                    detected_emotion = val
                    break

        if detected_emotion in ("positive",):
            profile.emotion_level = EmotionLevel.POSITIVE
            profile.bear_status = BearStatus.HAPPY
            session.emotion_assessment_done = True

            # 调用心理科普库
            kb_context = await self.kb.search("积极心理学 幸福 感恩", agent_role="cognitive_orchestrator")

            content = (
                "太好了！你的心情看起来不错 ☀️\n\n"
                "保持积极的心态是很宝贵的。记住，每天记录三件值得感激的小事，可以持续提升幸福感。\n\n"
                "要进一步和我聊聊吗？\n"
                "我可以陪你一起梳理困扰、理解情绪，并为你生成专属的心理情绪洞察报告。\n"
                "点击「陪你倾诉」，我们开始吧！"
            ) if is_zh else (
                "Great! You seem to be in a good mood ☀️\n\n"
                "Remember, recording three things you're grateful for each day can boost happiness.\n\n"
                "Would you like to chat more? Click 'Talk Together' to begin!"
            )

            self._save_session(session)
            return AgentResponse(
                agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                content=content,
                emotion_level=EmotionLevel.POSITIVE,
                action_links=[
                    {"label": "陪你倾诉" if is_zh else "Talk Together", "phase": "counseling", "type": "next"},
                    {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                ],
            )

        elif detected_emotion in ("mild", "moderate", "severe"):
            # 需要做量表评估
            profile.emotion_level = EmotionLevel(detected_emotion)

            content = (
                "为了更好地了解您的情绪状况，我们来做一个简短的情绪小测试。\n\n"
                "**过去两周，以下情况出现的频率是？**\n\n"
                "1. 做事情缺乏兴趣或乐趣\n"
                "2. 感到情绪低落、沮丧或绝望\n"
                "3. 感到紧张、焦虑或心神不宁\n"
                "4. 无法停止或控制担忧"
            ) if is_zh else (
                "To better understand your emotional state, let's do a brief assessment.\n\n"
                "**Over the past 2 weeks, how often have you experienced:**\n\n"
                "1. Little interest or pleasure in things\n"
                "2. Feeling down, depressed, or hopeless\n"
                "3. Feeling nervous, anxious, or on edge\n"
                "4. Not being able to stop or control worrying"
            )

            session.current_agent = AgentRole.COGNITIVE_ORCHESTRATOR
            self._save_session(session)

            return AgentResponse(
                agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                content=content,
                suggestions=(
                    ["完全没有", "好几天", "一半以上天数", "几乎每天"]
                    if is_zh else
                    ["Not at all", "Several days", "More than half the days", "Nearly every day"]
                ),
                metadata={"phase": "assessment_questions"},
                action_links=[
                    {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                ],
            )

        else:
            # 检查是否是量表回答
            score_map_zh = {"完全没有": 0, "好几天": 1, "一半以上天数": 2, "几乎每天": 3}
            score_map_en = {"not at all": 0, "several days": 1, "more than half the days": 2, "nearly every day": 3}

            score = None
            for key, val in score_map_zh.items():
                if key in user_message:
                    score = val
                    break
            if score is None:
                for key, val in score_map_en.items():
                    if key in user_lower:
                        score = val
                        break

            if score is not None:
                # 使用 counseling_data 中的计数器追踪已回答题目数
                if "assessment_answers" not in session.counseling_data:
                    session.counseling_data["assessment_answers"] = []
                session.counseling_data["assessment_answers"].append(score)
                answers = session.counseling_data["assessment_answers"]

                # 前两题是 PHQ-2，后两题是 GAD-2
                if len(answers) >= 2:
                    profile.phq2_score = answers[0] + answers[1]  # PHQ-2 总分
                if len(answers) >= 4:
                    profile.gad2_score = answers[2] + answers[3]  # GAD-2 总分

                # 判断是否完成评估（4题全部回答）
                if len(answers) >= 4:
                    session.emotion_assessment_done = True
                    total = profile.phq2_score + profile.gad2_score

                    if total <= 1:
                        profile.bear_status = BearStatus.HAPPY
                        bear_text = "开心小熊" if is_zh else "Happy Bear"
                        status_text = "当前未发现明显心理情绪风险" if is_zh else "No significant emotional risk detected"
                    elif total <= 3:
                        profile.bear_status = BearStatus.CALM
                        bear_text = "平静小熊" if is_zh else "Calm Bear"
                        status_text = "存在轻度心理情绪困扰" if is_zh else "Mild emotional distress detected"
                    else:
                        profile.bear_status = BearStatus.TIRED
                        bear_text = "疲惫小熊" if is_zh else "Tired Bear"
                        status_text = "心理情绪风险较高" if is_zh else "Higher emotional risk detected"

                    content = (
                        f"🐻 你的小熊状态：**{bear_text}**\n\n"
                        f"{status_text}\n\n"
                        "要进一步和我聊聊吗？\n"
                        "我可以陪你一起梳理困扰、理解情绪，并为你生成专属的心理情绪洞察报告。\n"
                        "点击「陪你倾诉」，我们开始吧！"
                    ) if is_zh else (
                        f"🐻 Your Bear Status: **{bear_text}**\n\n"
                        f"{status_text}\n\n"
                        "Would you like to chat more? Click 'Talk Together' to begin!"
                    )

                    self._save_session(session)
                    return AgentResponse(
                        agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                        content=content,
                        emotion_level=profile.emotion_level,
                        action_links=[
                            {"label": "陪你倾诉" if is_zh else "Talk Together", "phase": "counseling", "type": "next"},
                            {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                        ],
                    )
                else:
                    # 还需要继续回答
                    answers = session.counseling_data.get("assessment_answers", [])
                    q_num = len(answers) + 1
                    questions_zh = {2: "3. 感到紧张、焦虑或心神不宁", 3: "4. 无法停止或控制担忧"}
                    questions_en = {2: "3. Feeling nervous, anxious, or on edge", 3: "4. Not being able to stop or control worrying"}
                    content = (
                        "请继续回答下一个问题：\n\n"
                        + questions_zh.get(q_num, "3. 感到紧张、焦虑或心神不宁")
                    ) if is_zh else (
                        "Please answer the next question:\n\n"
                        + questions_en.get(q_num, "3. Feeling nervous, anxious, or on edge")
                    )

                    self._save_session(session)
                    return AgentResponse(
                        agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                        content=content,
                        suggestions=(
                            ["完全没有", "好几天", "一半以上天数", "几乎每天"]
                            if is_zh else
                            ["Not at all", "Several days", "More than half the days", "Nearly every day"]
                        ),
                        action_links=[
                            {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                        ],
                    )

            # 无法识别的输入
            return self._emotion_check_response(session)

    async def _handle_counseling(
        self, session: SessionState, user_message: str, agent_trace: list
    ) -> AgentResponse:
        """处理阶段2：陪你倾诉"""
        profile = session.profile
        is_zh = profile.language == Language.ZH

        # 检测沟通方式选择
        mode_map = {
            "文字": CommunicationMode.TEXT, "text": CommunicationMode.TEXT,
            "语音": CommunicationMode.VOICE, "voice": CommunicationMode.VOICE,
            "视频": CommunicationMode.VIDEO, "video": CommunicationMode.VIDEO,
        }
        for key, mode in mode_map.items():
            if key in user_message.lower():
                profile.communication_mode = mode
                break

        # 后台 Agent 链路
        agent_trace.append({"agent": "sensing", "status": "analyzing", "label": "Sensing Agent 情感分析..."})
        sensing_result = await self.agents[AgentRole.SENSING].analyze(user_message, profile)
        agent_trace[-1]["status"] = "done"

        agent_trace.append({"agent": "risk", "status": "scanning", "label": "Risk Agent 危机扫描..."})
        risk_result = {"risk_level": 0, "action": "continue"}
        if sensing_result.sentiment == "negative" or sensing_result.intensity > 0.6:
            risk_result = await self.agents[AgentRole.RISK].quick_check(user_message, profile)
        agent_trace[-1]["status"] = "done"

        # 危机熔断
        if risk_result.get("action") in ("interrupt", "crisis"):
            return self._crisis_response(session)

        # 知识库检索
        kb_context = await self.kb.search(
            user_message, agent_role="counselor",
            cultural_bg=profile.cultural_bg.value,
        )

        # Counselor Agent 处理
        agent_trace.append({"agent": "counselor", "status": "thinking", "label": "Counselor Agent 咨询中..."})
        counselor = self.agents[AgentRole.COUNSELOR]
        response = await counselor.chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=kb_context,
        )
        agent_trace[-1]["status"] = "done"

        # 记录历史
        session.history.append({"role": "user", "content": user_message})
        session.history.append({"role": "assistant", "content": response.content})

        # 收集咨询数据
        if response.metadata.get("counseling_data"):
            session.counseling_data.update(response.metadata["counseling_data"])

        # Case Formulation（后台构建）
        if session.counseling_data:
            agent_trace.append({"agent": "case_formulation", "status": "building", "label": "构建心理模型..."})
            cf = await self.agents[AgentRole.CASE_FORMULATION].build(session.counseling_data, profile)
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

        # 如果 Counselor 判断信息收集完毕，生成洞察报告
        if response.should_transition:
            agent_trace.append({"agent": "insight_report", "status": "generating", "label": "生成洞察报告..."})
            session.insight_report = await self.agents[AgentRole.INSIGHT_REPORT].generate(
                case_formulation=session.case_formulation,
                cultural_analysis={},
                profile=profile,
            )
            agent_trace[-1]["status"] = "done"

            self._save_session(session)
            return AgentResponse(
                agent=AgentRole.COGNITIVE_ORCHESTRATOR,
                content=(
                    "谢谢你的分享。\n\n"
                    "接下来，我将结合你的经历、情绪状态和文化背景，为你生成专属的心理情绪洞察报告。\n"
                    "点击「看见自己」即可帮助你理解这些感受是如何形成的，以及此刻的你最需要什么。"
                ) if is_zh else (
                    "Thank you for sharing.\n\n"
                    "Next, I'll generate a personalized insight report based on your experience.\n"
                    "Click 'See Yourself' to understand how these feelings formed."
                ),
                action_links=[
                    {"label": "看见自己" if is_zh else "See Yourself", "phase": "insight", "type": "next"},
                    {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                ],
                metadata={"agent_trace": agent_trace},
            )

        # 添加导航链接
        response.action_links = [
            {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
        ]
        response.metadata["agent_trace"] = agent_trace
        self._save_session(session)
        return response

    async def _handle_coaching(
        self, session: SessionState, user_message: str, agent_trace: list
    ) -> AgentResponse:
        """处理阶段4：一起练习"""
        profile = session.profile
        is_zh = profile.language == Language.ZH

        # 检测反馈
        feedback_map = {
            "好很多": "positive", "有一点改善": "positive",
            "没变化": "neutral", "更糟了": "negative",
            "much better": "positive", "some improvement": "positive",
            "no change": "neutral", "worse": "negative",
        }

        feedback = None
        user_lower = user_message.lower()
        for key, val in feedback_map.items():
            if key in user_message or key in user_lower:
                feedback = val
                break

        if feedback == "positive":
            content = (
                "很高兴这次练习对你有所帮助。情绪的改善往往来自一次次小的调整。\n"
                "你已经迈出了重要的一步。"
            ) if is_zh else (
                "Glad this exercise helped. Emotional improvement comes from small adjustments.\n"
                "You've taken an important step."
            )
            self._save_session(session)
            return AgentResponse(
                agent=AgentRole.COACH,
                content=content,
                action_links=[
                    {"label": "再来一次" if is_zh else "Again", "phase": "coaching", "type": "next"},
                    {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                ],
            )
        elif feedback == "neutral":
            content = (
                "谢谢你的反馈。有时候第一次练习可能还无法带来明显变化。"
            ) if is_zh else (
                "Thanks for your feedback. Sometimes the first exercise may not bring noticeable change."
            )
            self._save_session(session)
            return AgentResponse(
                agent=AgentRole.COACH,
                content=content,
                suggestions=["重新训练" if is_zh else "Try again", "以后再说" if is_zh else "Later"],
                action_links=[
                    {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                ],
            )
        elif feedback == "negative":
            content = (
                "谢谢你告诉我。有时候在练习过程中，原本压抑的情绪可能会暂时浮现出来。\n\n"
                "你想怎么做？"
            ) if is_zh else (
                "Thank you for telling me. Sometimes suppressed emotions may surface during exercises.\n\n"
                "What would you like to do?"
            )
            self._save_session(session)
            return AgentResponse(
                agent=AgentRole.COACH,
                content=content,
                suggestions=(
                    ["继续和我聊聊", "联系支持资源", "紧急帮助"]
                    if is_zh else
                    ["Keep talking", "Support resources", "Emergency help"]
                ),
                action_links=[
                    {"label": "陪你倾诉" if is_zh else "Talk Together", "phase": "counseling", "type": "next"},
                    {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
                ],
            )

        # Coach Agent 引导训练
        kb_context = await self.kb.search(user_message, agent_role="coach")
        coach = self.agents[AgentRole.COACH]
        response = await coach.chat(
            user_message=user_message,
            history=session.history,
            profile=profile,
            knowledge_context=kb_context,
        )

        session.history.append({"role": "user", "content": user_message})
        session.history.append({"role": "assistant", "content": response.content})

        response.action_links = [
            {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
        ]
        self._save_session(session)
        return response

    def _crisis_response(self, session: SessionState) -> AgentResponse:
        """危机响应"""
        is_zh = session.profile.language == Language.ZH
        session.profile.crisis_triggered = True
        session.profile.emotion_level = EmotionLevel.CRISIS

        content = (
            "听到你这么说，我非常担心，但希望你知道：你并不孤单。\n\n"
            "如果你此刻感到无法承受，请立即寻求专业的紧急帮助：\n\n"
            "🇨🇳 中国：拨打 110 或 120 | 全国心理援助热线：12356\n"
            "🇺🇸 美国：拨打或短信 988 | Crisis Text Line：发 HOME 到 741741\n"
            "🌍 国际：https://www.iasp.info/resources/Crisis_Centres/"
        ) if is_zh else (
            "I'm very concerned about what you're saying. You are not alone.\n\n"
            "If you're feeling overwhelmed, please seek immediate help:\n\n"
            "🇺🇸 US: Call/text 988 | Crisis Text Line: text HOME to 741741\n"
            "🇨🇳 China: Call 110 or 120 | Mental Health Hotline: 12356\n"
            "🌍 International: https://www.iasp.info/resources/Crisis_Centres/"
        )

        self._save_session(session)
        return AgentResponse(
            agent=AgentRole.RISK,
            content=content,
            emotion_level=EmotionLevel.CRISIS,
            action_links=[
                {"label": "继续和我聊聊" if is_zh else "Keep Talking", "phase": "counseling", "type": "next"},
                {"label": "返回主页" if is_zh else "Home", "phase": "home", "type": "home"},
            ],
        )

    # ─── 状态查询 ─────────────────────────────────────────────
    def get_state(self, session_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "session not found"}
        return {
            "session_id": session.session_id,
            "current_phase": session.current_phase.value,
            "current_agent": session.current_agent.value,
            "profile": {
                "name": session.profile.name,
                "language": session.profile.language.value,
                "cultural_bg": session.profile.cultural_bg.value,
                "phq2_score": session.profile.phq2_score,
                "gad2_score": session.profile.gad2_score,
                "emotion_level": session.profile.emotion_level.value,
                "bear_status": session.profile.bear_status.value,
                "turns": session.profile.session_turns,
                "crisis_triggered": session.profile.crisis_triggered,
                "communication_mode": session.profile.communication_mode.value,
            },
            "insight_report": session.insight_report,
            "training_records": session.training_records,
            "emotion_assessment_done": session.emotion_assessment_done,
        }

    # ─── 持久化 ─────────────────────────────────────────────
    def _save_session(self, session: SessionState):
        data = {
            "session_id": session.session_id,
            "current_phase": session.current_phase.value,
            "current_agent": session.current_agent.value,
            "history": session.history,
            "counseling_data": session.counseling_data,
            "case_formulation": session.case_formulation,
            "insight_report": session.insight_report,
            "training_records": session.training_records,
            "emotion_assessment_done": session.emotion_assessment_done,
            "created_at": session.created_at,
            "last_active": session.last_active,
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
                "crisis_triggered": session.profile.crisis_triggered,
                "communication_mode": session.profile.communication_mode.value,
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
                    language=Language(pd.get("language", "zh")),
                    cultural_bg=CulturalBackground(pd.get("cultural_bg", "unknown")),
                    phq2_score=pd.get("phq2_score", 0),
                    gad2_score=pd.get("gad2_score", 0),
                    emotion_level=EmotionLevel(pd.get("emotion_level", "mild")),
                    bear_status=BearStatus(pd.get("bear_status", "calm")),
                    session_turns=pd.get("session_turns", 0),
                    crisis_triggered=pd.get("crisis_triggered", False),
                    communication_mode=CommunicationMode(pd.get("communication_mode", "text")),
                    tags=pd.get("tags", []),
                )
                session = SessionState(
                    session_id=data["session_id"],
                    profile=profile,
                    current_phase=Phase(data.get("current_phase", "home")),
                    current_agent=AgentRole(data.get("current_agent", "cognitive_orchestrator")),
                    history=data.get("history", []),
                    counseling_data=data.get("counseling_data", {}),
                    case_formulation=data.get("case_formulation", {}),
                    insight_report=data.get("insight_report", {}),
                    training_records=data.get("training_records", []),
                    emotion_assessment_done=data.get("emotion_assessment_done", False),
                    created_at=data.get("created_at", 0),
                    last_active=data.get("last_active", 0),
                )
                self.sessions[session.session_id] = session
            except Exception:
                continue
