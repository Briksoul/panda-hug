"""Agent 基类 — 所有心理 Agent 的公共框架"""
from __future__ import annotations
import json
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from openai import AsyncOpenAI
from config import config


# ─── 枚举 ────────────────────────────────────────────────────────────
class AgentRole(str, Enum):
    TRIAGE = "triage"
    SENSING = "sensing"
    CULTURAL = "cultural"
    COACH = "coach"
    CRISIS = "crisis"


class EmotionLevel(str, Enum):
    POSITIVE = "positive"       # 积极
    MILD = "mild"               # 轻微
    MODERATE = "moderate"       # 中等
    SEVERE = "severe"           # 严重
    CRISIS = "crisis"           # 危机


class CulturalBackground(str, Enum):
    CHINA = "china"              # 在中国生活
    ABROAD = "abroad"            # 在海外生活
    UNKNOWN = "unknown"


# ─── 数据结构 ──────────────────────────────────────────────────────────
@dataclass
class UserProfile:
    """用户心理档案"""
    user_id: str = ""
    name: str = ""
    cultural_bg: CulturalBackground = CulturalBackground.UNKNOWN
    phq2_score: int = 0          # 0-6
    gad2_score: int = 0          # 0-6
    emotion_level: EmotionLevel = EmotionLevel.MILD
    session_turns: int = 0
    crisis_triggered: bool = False
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
    should_transition: bool = False     # 是否切换到下一个 Agent
    next_agent: Optional[AgentRole] = None
    metadata: dict[str, Any] = field(default_factory=dict)


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
        """与用户对话的核心方法"""
        system = self._build_system_prompt(profile, knowledge_context)
        messages = [{"role": "system", "content": system}]
        messages.extend(history[-20:])  # 保留最近 20 轮
        messages.append({"role": "user", "content": user_message})

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
            return AgentResponse(
                agent=self.role,
                content="抱歉，系统暂时遇到了问题，请稍后再试。",
                metadata={"error": str(e)},
            )

    def _build_system_prompt(self, profile: UserProfile, knowledge_context: str) -> str:
        """构建系统提示词（子类可覆盖）"""
        base = self.system_prompt
        ctx_parts = [base]

        if profile.cultural_bg != CulturalBackground.UNKNOWN:
            ctx_parts.append(f"\n用户文化背景：{profile.cultural_bg.value}")
        if profile.emotion_level:
            ctx_parts.append(f"当前情绪等级：{profile.emotion_level.value}")
        if knowledge_context:
            ctx_parts.append(f"\n相关知识库参考：\n{knowledge_context}")

        return "\n".join(ctx_parts)

    @abstractmethod
    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        """解析 LLM 原始输出为结构化响应"""
        ...

    def _json_parse(self, text: str) -> dict:
        """安全解析 JSON"""
        # 尝试提取 JSON 块
        import re
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
