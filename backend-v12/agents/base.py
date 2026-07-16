"""Agent 基类 — 所有心理 Agent 的公共框架"""
from __future__ import annotations
import json
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional

from openai import AsyncOpenAI
from config import config


# ─── 枚举 ────────────────────────────────────────────────────────────
class AgentRole(str, Enum):
    TRIAGE = "triage"
    COUNSELOR = "counselor"
    SENSING = "sensing"
    RISK = "risk"
    CASE_FORMULATION = "case_formulation"
    SUPERVISOR = "supervisor"
    CULTURAL = "cultural"
    INSIGHT_REPORT = "insight_report"
    MEMORY = "memory"
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


class CulturalIdentity(str, Enum):
    CHINESE_IN_US = "chinese_in_us"
    AMERICAN_IN_CHINA = "american_in_china"
    OTHER = "other"
    UNKNOWN = "unknown"


class AdaptationStage(str, Enum):
    HONEYMOON = "honeymoon"
    CULTURE_SHOCK = "culture_shock"
    RECOVERY = "recovery"
    ADJUSTMENT = "adjustment"
    UNKNOWN = "unknown"


# ─── 数据结构 ──────────────────────────────────────────────────────────
@dataclass
class UserProfile:
    """用户心理档案"""
    user_id: str = ""
    name: str = ""
    cultural_bg: CulturalBackground = CulturalBackground.UNKNOWN
    cultural_identity: CulturalIdentity = CulturalIdentity.UNKNOWN
    adaptation_stage: AdaptationStage = AdaptationStage.UNKNOWN
    phq2_score: int = 0          # 0-6
    gad2_score: int = 0          # 0-6
    emotion_level: EmotionLevel = EmotionLevel.MILD
    session_turns: int = 0
    crisis_triggered: bool = False
    tags: list[str] = field(default_factory=list)
    memory_summary: str = ""
    language: str = "zh"
    study_abroad_months: int = 0


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
    model_tier: str = "pro"

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
        on_text_chunk: Callable[[str], Any] | None = None,
    ) -> AgentResponse:
        """与用户对话的核心方法"""
        system = self._build_system_prompt(profile, knowledge_context)
        messages = [{"role": "system", "content": system}]
        recent_history = history[-20:]
        messages.extend(
            {"role": message["role"], "content": message["content"]}
            for message in recent_history
        )
        if not recent_history or recent_history[-1].get("role") != "user" or recent_history[-1].get("content") != user_message:
            messages.append({"role": "user", "content": user_message})

        model_name = (
            config.LLM_FAST_MODEL
            if self.model_tier == "fast"
            else config.LLM_MODEL
        )
        try:
            budgets = [config.LLM_MAX_TOKENS, min(config.LLM_MAX_TOKENS * 2, 8192)]
            last_finish_reason = ""
            for budget in dict.fromkeys(budgets):
                emitted_text = ""
                stream_mode = None
                if on_text_chunk:
                    stream = await self.client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=config.LLM_TEMPERATURE,
                        max_tokens=budget,
                        stream=True,
                    )
                    raw_parts = []
                    async for chunk in stream:
                        if not chunk.choices:
                            continue
                        choice = chunk.choices[0]
                        delta = choice.delta.content or ""
                        if delta:
                            raw_parts.append(delta)
                            accumulated = "".join(raw_parts)
                            stripped = accumulated.lstrip()
                            if stream_mode is None and stripped:
                                if stripped.startswith("{"):
                                    stream_mode = "json"
                                elif stripped.startswith("`") and len(stripped) < 3:
                                    continue
                                elif stripped.startswith("```"):
                                    stream_mode = "json"
                                else:
                                    stream_mode = "text"
                            visible_text = (
                                self._extract_reply_prefix(accumulated)
                                if stream_mode == "json"
                                else accumulated
                            )
                            if len(visible_text) > len(emitted_text):
                                await self._emit_text(
                                    on_text_chunk,
                                    visible_text[len(emitted_text):],
                                )
                                emitted_text = visible_text
                        if choice.finish_reason:
                            last_finish_reason = choice.finish_reason
                    raw = "".join(raw_parts)
                else:
                    resp = await self.client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=config.LLM_TEMPERATURE,
                        max_tokens=budget,
                    )
                    choice = resp.choices[0]
                    raw = choice.message.content or ""
                    last_finish_reason = choice.finish_reason or ""
                if raw.strip():
                    response = self._parse_response(raw, profile)
                    response.metadata.setdefault("model", model_name)
                    if on_text_chunk and not emitted_text and response.content:
                        await self._emit_text(on_text_chunk, response.content)
                    return response
                print(
                    f"[Agent Empty Response] {self.role}: "
                    f"finish_reason={last_finish_reason}, budget={budget}"
                )

            return AgentResponse(
                agent=self.role,
                content="抱歉，我刚才没有生成有效回复。请再说一次，我会继续陪着你。",
                metadata={
                    "error": "empty_model_response",
                    "finish_reason": last_finish_reason,
                    "model": model_name,
                },
            )
        except Exception as e:
            print(f"[Agent Error] {self.role}: {e}")
            return AgentResponse(
                agent=self.role,
                content="抱歉，系统暂时遇到了问题，请稍后再试。",
                metadata={"error": str(e), "model": model_name},
            )

    @staticmethod
    async def _emit_text(callback: Callable[[str], Any], text: str):
        result = callback(text)
        if hasattr(result, "__await__"):
            await result

    @staticmethod
    def _extract_reply_prefix(raw: str) -> str:
        match = re.search(r'"reply"\s*:\s*"', raw)
        if not match:
            return ""

        decoded = []
        index = match.end()
        escapes = {
            '"': '"',
            "\\": "\\",
            "/": "/",
            "b": "\b",
            "f": "\f",
            "n": "\n",
            "r": "\r",
            "t": "\t",
        }
        while index < len(raw):
            char = raw[index]
            if char == '"':
                break
            if char != "\\":
                decoded.append(char)
                index += 1
                continue

            if index + 1 >= len(raw):
                break
            escaped = raw[index + 1]
            if escaped == "u":
                code = raw[index + 2:index + 6]
                if len(code) < 4 or not all(
                    char in "0123456789abcdefABCDEF" for char in code
                ):
                    break
                decoded.append(chr(int(code, 16)))
                index += 6
                continue
            decoded.append(escapes.get(escaped, escaped))
            index += 2

        return "".join(decoded)

    def _build_system_prompt(self, profile: UserProfile, knowledge_context: str) -> str:
        """构建系统提示词（子类可覆盖）"""
        base = self.system_prompt
        ctx_parts = [base]

        if profile.cultural_bg != CulturalBackground.UNKNOWN:
            ctx_parts.append(f"\n用户文化背景：{profile.cultural_bg.value}")
        if profile.cultural_identity != CulturalIdentity.UNKNOWN:
            ctx_parts.append(f"用户跨文化身份：{profile.cultural_identity.value}")
        if profile.adaptation_stage != AdaptationStage.UNKNOWN:
            ctx_parts.append(f"当前文化适应阶段：{profile.adaptation_stage.value}")
        if profile.emotion_level:
            ctx_parts.append(f"当前情绪等级：{profile.emotion_level.value}")
        if profile.memory_summary:
            ctx_parts.append(f"\n长期记忆摘要：\n{profile.memory_summary}")
        ctx_parts.append(
            f"用户偏好语言：{'English' if profile.language == 'en' else '中文'}"
        )
        if profile.study_abroad_months > 0:
            ctx_parts.append(
                f"跨文化生活或留学时长：约 {profile.study_abroad_months} 个月"
            )
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
