"""Sensing Agent V4 — 多模态感知（后台情感分析）"""
from __future__ import annotations
import json
import re
from dataclasses import dataclass
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel,
    UserProfile, get_llm, config,
)


@dataclass
class SensingResult:
    """感知分析结果"""
    sentiment: str = "neutral"          # positive/neutral/negative
    crisis_keywords: list[str] = None
    emotion_tags: list[str] = None
    intensity: float = 0.0              # 0.0 - 1.0
    confidence: float = 1.0             # #9 置信度 0.0 - 1.0
    should_trigger_crisis: bool = False
    modality_used: str = "text"          # #9 使用的模态: text/voice/video

    def __post_init__(self):
        if self.crisis_keywords is None:
            self.crisis_keywords = []
        if self.emotion_tags is None:
            self.emotion_tags = []


# 危机关键词库
CRISIS_KEYWORDS = {
    "zh": [
        "自杀", "想死", "不想活", "活不下去", "结束生命", "割腕", "跳楼",
        "吃药", "遗书", "活够了", "不如死了", "解脱", "消失", "没有意义",
    ],
    "en": [
        "suicide", "kill myself", "want to die", "end my life", "self-harm",
        "cutting", "overdose", "no reason to live", "better off dead",
    ],
}


class SensingAgent(BaseAgent):
    """V4: 文本情感分析，后台运行"""
    role = AgentRole.SENSING

    async def analyze(self, text: str, profile: UserProfile) -> SensingResult:
        """分析用户输入的情感和危机信号"""
        result = SensingResult()

        # 1. 关键词检测（快速路径）
        text_lower = text.lower()
        for lang_keywords in CRISIS_KEYWORDS.values():
            for kw in lang_keywords:
                if kw in text_lower:
                    result.crisis_keywords.append(kw)

        if result.crisis_keywords:
            result.should_trigger_crisis = True
            result.intensity = 0.9
            result.sentiment = "negative"
            return result

        # 2. LLM 深度情感分析
        try:
            client = get_llm()
            resp = await client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "你是情感分析引擎。分析用户输入的情感状态。\n"
                            "返回JSON：\n"
                            '{"sentiment":"positive/neutral/negative",'
                            '"emotion_tags":["焦虑","孤独"],'
                            '"intensity":0.0-1.0}\n'
                            "只返回JSON，不要其他内容。"
                        ),
                    },
                    {"role": "user", "content": text},
                ],
                temperature=0.1,
                max_tokens=200,
            )
            raw = resp.choices[0].message.content or "{}"
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                data = json.loads(m.group(0))
                result.sentiment = data.get("sentiment", "neutral")
                result.emotion_tags = data.get("emotion_tags", [])
                result.intensity = float(data.get("intensity", 0.5))
                result.confidence = float(data.get("confidence", 0.8))
        except Exception:
            pass

        # #9 置信度过低时，降低权重
        if result.confidence < 0.4:
            result.modality_used = "text"
            result.intensity = max(0.1, result.intensity * 0.5)

        return result

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        return AgentResponse(agent=self.role, content=raw)
