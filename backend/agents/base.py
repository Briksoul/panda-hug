"""Agent 基类 V4 — Panda Hug 跨文化智能心理伴侣"""
from __future__ import annotations
import json
import time
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from openai import AsyncOpenAI
from config import config


# ─── 枚举 ────────────────────────────────────────────────────────────
class AgentRole(str, Enum):
    """V4 七大智能体"""
    COGNITIVE_ORCHESTRATOR = "cognitive_orchestrator"  # 大脑：调度全局
    COUNSELOR = "counselor"                            # 前台：心理咨询
    SENSING = "sensing"                                # 分析员：情感分析
    RISK = "risk"                                      # 守门员：危机监测
    CASE_FORMULATION = "case_formulation"              # 侦探：心理模型构建
    INSIGHT_REPORT = "insight_report"                  # 报告员：洞察报告
    COACH = "coach"                                    # 教练：放松训练


class Phase(str, Enum):
    """V4 四阶段"""
    HOME = "home"                    # 首页
    EMOTION_CHECK = "emotion_check"  # 阶段1：懂你情绪
    COUNSELING = "counseling"        # 阶段2：陪你倾诉
    INSIGHT = "insight"              # 阶段3：看见自己
    COACHING = "coaching"            # 阶段4：一起练习


class EmotionLevel(str, Enum):
    POSITIVE = "positive"       # 积极（开心小熊）
    MILD = "mild"               # 轻微（平静小熊）
    MODERATE = "moderate"       # 中等（平静小熊）
    SEVERE = "severe"           # 严重（疲惫小熊）
    CRISIS = "crisis"           # 危机


class BearStatus(str, Enum):
    """小熊状态"""
    HAPPY = "happy"       # 开心小熊
    CALM = "calm"         # 平静小熊
    TIRED = "tired"       # 疲惫小熊


class CulturalBackground(str, Enum):
    CHINA = "china"              # 在中国生活
    ABROAD = "abroad"            # 在海外生活
    INTERNATIONAL = "international"  # 国际留学生
    UNKNOWN = "unknown"


class Language(str, Enum):
    ZH = "zh"
    EN = "en"


class CommunicationMode(str, Enum):
    """沟通方式"""
    TEXT = "text"
    VOICE = "voice"
    VIDEO = "video"


# ─── 数据结构 ──────────────────────────────────────────────────────────
@dataclass
class UserProfile:
    """用户心理档案"""
    user_id: str = ""
    name: str = ""
    language: Language = Language.ZH
    cultural_bg: CulturalBackground = CulturalBackground.UNKNOWN
    phq2_score: int = 0          # 0-6
    gad2_score: int = 0          # 0-6
    emotion_level: EmotionLevel = EmotionLevel.MILD
    bear_status: BearStatus = BearStatus.CALM
    session_turns: int = 0
    crisis_triggered: bool = False
    communication_mode: CommunicationMode = CommunicationMode.TEXT
    tags: list[str] = field(default_factory=list)


@dataclass
class AgentMessage:
    """Agent 间通信消息"""
    sender: AgentRole
    receiver: AgentRole
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class AgentResponse:
    """Agent 返回给用户的响应"""
    agent: AgentRole
    content: str
    emotion_level: Optional[EmotionLevel] = None
    suggestions: list[str] = field(default_factory=list)
    should_transition: bool = False     # 是否切换到下一个阶段
    next_phase: Optional[Phase] = None  # 下一个阶段
    next_agent: Optional[AgentRole] = None
    metadata: dict[str, Any] = field(default_factory=dict)
    # V4 新增：超链接导航
    action_links: list[dict[str, str]] = field(default_factory=list)
    # 示例: [{"label": "陪你倾诉", "phase": "counseling", "type": "next"}, {"label": "返回主页", "phase": "home", "type": "home"}]


# ─── LLM 客户端 ────────────────────────────────────────────────────────
_llm_client: AsyncOpenAI | None = None


def get_llm() -> AsyncOpenAI:
    global _llm_client
    if _llm_client is None:
        _llm_client = AsyncOpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL,
        )
    return _llm_client


# ─── Agent 基类 ────────────────────────────────────────────────────────
class BaseAgent(ABC):
    """所有 Agent 的抽象基类"""

    role: AgentRole
    system_prompt: str = ""

    def __init__(self):
        self._client = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = get_llm()
        return self._client

    async def chat(
        self,
        user_message: str,
        history: list[dict[str, str]],
        profile: UserProfile,
        knowledge_context: str = "",
    ) -> AgentResponse:
        """与用户对话的核心方法（含重试机制）"""
        system = self._build_system_prompt(profile, knowledge_context)
        messages = [{"role": "system", "content": system}]
        messages.extend(history[-20:])
        messages.append({"role": "user", "content": user_message})

        max_retries = 3
        for attempt in range(max_retries):
            try:
                resp = await self.client.chat.completions.create(
                    model=config.LLM_MODEL,
                    messages=messages,
                    temperature=config.LLM_TEMPERATURE,
                    max_tokens=config.LLM_MAX_TOKENS,
                )
                raw = resp.choices[0].message.content or ""
                return self._parse_response(raw, profile)
            except Exception as e:
                print(f"[Agent Error] {self.role} attempt {attempt+1}/{max_retries}: {e}")
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(1 * (attempt + 1))
                else:
                    # 全部失败，返回兜底话术，不抛500
                    is_zh = profile.language == Language.ZH
                    fallback = is_zh and "Panda 的大脑刚才开了一下小差，你可以再说一遍吗？" or "Panda's brain took a quick break. Could you say that again?"
                    return AgentResponse(
                        agent=self.role,
                        content=fallback,
                        metadata={"error": str(e), "fallback": True},
                    )

    def _build_system_prompt(self, profile: UserProfile, knowledge_context: str) -> str:
        """构建系统提示词（子类可覆盖）"""
        base = self.system_prompt
        ctx_parts = [base]

        if profile.cultural_bg != CulturalBackground.UNKNOWN:
            ctx_parts.append(f"\n用户文化背景：{profile.cultural_bg.value}")
        if profile.language:
            ctx_parts.append(f"用户语言：{profile.language.value}")
        if profile.emotion_level:
            ctx_parts.append(f"当前情绪等级：{profile.emotion_level.value}")
        if profile.bear_status:
            ctx_parts.append(f"小熊状态：{profile.bear_status.value}")
        if knowledge_context:
            ctx_parts.append(f"\n相关知识库参考：\n{knowledge_context}")

        return "\n".join(ctx_parts)

    @abstractmethod
    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        """解析 LLM 原始输出为结构化响应"""
        ...

    def _json_parse(self, text: str) -> dict:
        """安全解析 JSON"""
        m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        if m:
            text = m.group(1)
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            text = m.group(0)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {}

    def _strip_json_from_content(self, content: str) -> str:
        """从回复中移除 JSON 块，只保留自然语言部分"""
        # 移除 ```json ... ``` 块
        content = re.sub(r"```json\s*.*?\s*```", "", content, flags=re.DOTALL).strip()
        # 移除独立的 JSON 对象
        content = re.sub(r"\{[^{}]*\}", "", content).strip()
        return content if content else content
