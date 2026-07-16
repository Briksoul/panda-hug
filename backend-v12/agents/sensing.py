"""Sensing Agent — text-based emotion analysis."""
from __future__ import annotations
from dataclasses import dataclass
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel,
    UserProfile,
)


@dataclass
class SensingResult:
    """感知分析结果"""
    sentiment: str = "neutral"          # positive/neutral/negative
    crisis_keywords: list[str] = None
    emotion_tags: list[str] = None
    intensity: float = 0.0              # 0.0 - 1.0
    should_trigger_crisis: bool = False

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

EMOTION_KEYWORDS = {
    "焦虑": ["焦虑", "紧张", "担心", "心慌", "anxious", "anxiety", "worried", "nervous"],
    "悲伤": ["悲伤", "难过", "低落", "沮丧", "sad", "depressed", "down"],
    "孤独": ["孤独", "孤单", "想家", "没人理解", "lonely", "homesick"],
    "愤怒": ["生气", "愤怒", "烦躁", "恼火", "angry", "furious", "irritated"],
    "压力": ["压力", "压抑", "崩溃", "喘不过气", "stress", "overwhelmed"],
    "疲惫": ["疲惫", "累", "失眠", "没精神", "tired", "exhausted", "insomnia"],
}

POSITIVE_KEYWORDS = [
    "开心", "高兴", "平静", "放松", "好多了", "有希望", "充满活力",
    "happy", "calm", "relaxed", "better", "hopeful", "energetic",
]

INTENSIFIERS = ["非常", "特别", "极度", "很", "太", "really", "very", "extremely"]

HUME_EMOTION_LABELS = {
    "anger": "愤怒",
    "anxiety": "焦虑",
    "awkwardness": "尴尬",
    "boredom": "无聊",
    "calmness": "平静",
    "confusion": "困惑",
    "contemplation": "沉思",
    "disappointment": "失望",
    "distress": "痛苦",
    "excitement": "兴奋",
    "fear": "恐惧",
    "interest": "兴趣",
    "joy": "喜悦",
    "pain": "痛苦",
    "sadness": "悲伤",
    "satisfaction": "满足",
    "shame": "羞愧",
    "tiredness": "疲惫",
}
HUME_NEGATIVE_EMOTIONS = {
    "anger", "anxiety", "awkwardness", "boredom", "confusion", "contempt",
    "disappointment", "disgust", "distress", "doubt", "embarrassment",
    "empathicPain", "envy", "fear", "guilt", "horror", "pain", "sadness",
    "shame", "surpriseNegative", "tiredness",
}
HUME_POSITIVE_EMOTIONS = {
    "admiration", "adoration", "amusement", "awe", "calmness",
    "contentment", "ecstasy", "excitement", "interest", "joy", "love",
    "pride", "relief", "romance", "satisfaction", "surprisePositive",
    "triumph",
}


class SensingAgent(BaseAgent):
    """Analyze emotional signals in text input."""
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

        negative_hits = 0
        for emotion, keywords in EMOTION_KEYWORDS.items():
            matches = sum(keyword in text_lower for keyword in keywords)
            if matches:
                result.emotion_tags.append(emotion)
                negative_hits += matches

        positive_hits = sum(
            keyword in text_lower for keyword in POSITIVE_KEYWORDS
        )
        intensity_boost = 0.15 if any(
            word in text_lower for word in INTENSIFIERS
        ) else 0.0

        if negative_hits > positive_hits:
            result.sentiment = "negative"
            result.intensity = min(
                0.95,
                0.4 + negative_hits * 0.1 + intensity_boost,
            )
        elif positive_hits:
            result.sentiment = "positive"
            result.intensity = min(
                0.9,
                0.35 + positive_hits * 0.1 + intensity_boost,
            )
        else:
            result.sentiment = "neutral"
            result.intensity = 0.2

        return result

    def fuse_voice_analysis(
        self,
        text_result: SensingResult,
        emotion_scores: dict[str, float],
    ) -> tuple[SensingResult, dict]:
        """Fuse Hume prosody scores with text signals without acoustic crisis gating."""
        scores = {
            name: round(max(0.0, min(1.0, float(score))), 4)
            for name, score in emotion_scores.items()
            if isinstance(name, str) and isinstance(score, (int, float))
        }
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        negative_peak = max(
            (scores.get(name, 0.0) for name in HUME_NEGATIVE_EMOTIONS),
            default=0.0,
        )
        positive_peak = max(
            (scores.get(name, 0.0) for name in HUME_POSITIVE_EMOTIONS),
            default=0.0,
        )

        if negative_peak >= 0.28 and negative_peak > positive_peak + 0.06:
            acoustic_sentiment = "negative"
            acoustic_intensity = negative_peak
        elif positive_peak >= 0.28 and positive_peak > negative_peak + 0.06:
            acoustic_sentiment = "positive"
            acoustic_intensity = positive_peak
        else:
            acoustic_sentiment = "neutral"
            acoustic_intensity = max(negative_peak, positive_peak, 0.2)

        fused = SensingResult(
            sentiment=text_result.sentiment,
            crisis_keywords=list(text_result.crisis_keywords),
            emotion_tags=list(text_result.emotion_tags),
            intensity=text_result.intensity,
            should_trigger_crisis=text_result.should_trigger_crisis,
        )
        if fused.sentiment == "neutral" and acoustic_sentiment != "neutral":
            fused.sentiment = acoustic_sentiment
        elif (
            fused.sentiment != "neutral"
            and acoustic_sentiment == fused.sentiment
        ):
            fused.intensity = min(
                1.0,
                fused.intensity * 0.55 + acoustic_intensity * 0.65,
            )

        if acoustic_sentiment != "neutral":
            fused.intensity = max(fused.intensity, acoustic_intensity)
        for name, score in ranked[:3]:
            if score >= 0.12:
                label = HUME_EMOTION_LABELS.get(name, name)
                if label not in fused.emotion_tags:
                    fused.emotion_tags.append(label)

        incongruent = (
            text_result.sentiment in ("positive", "negative")
            and acoustic_sentiment in ("positive", "negative")
            and text_result.sentiment != acoustic_sentiment
        )
        psychological_signals = {
            "distress": round(max(
                scores.get("distress", 0.0),
                scores.get("pain", 0.0),
                scores.get("sadness", 0.0),
            ), 4),
            "anxiety": round(max(
                scores.get("anxiety", 0.0),
                scores.get("fear", 0.0),
            ), 4),
            "low_mood": round(max(
                scores.get("sadness", 0.0),
                scores.get("disappointment", 0.0),
                scores.get("tiredness", 0.0),
            ), 4),
            "arousal": round(max(
                scores.get("excitement", 0.0),
                scores.get("anxiety", 0.0),
                scores.get("anger", 0.0),
                scores.get("fear", 0.0),
            ), 4),
        }
        return fused, {
            "provider": "hume",
            "scores": scores,
            "top_emotions": [
                {
                    "name": name,
                    "label": HUME_EMOTION_LABELS.get(name, name),
                    "score": score,
                }
                for name, score in ranked[:5]
            ],
            "acoustic_sentiment": acoustic_sentiment,
            "acoustic_intensity": round(acoustic_intensity, 4),
            "psychological_signals": psychological_signals,
            "text_voice_incongruent": incongruent,
            "disclaimer": (
                "Vocal-expression estimate only; not a clinical diagnosis "
                "and not an independent crisis trigger."
            ),
        }

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        return AgentResponse(agent=self.role, content=raw)
