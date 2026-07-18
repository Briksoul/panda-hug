"""Guardrail — 零延迟危机拦截器（纯正则，绕过 LLM）"""
from __future__ import annotations
import re
from dataclasses import dataclass


@dataclass
class GuardrailResult:
    triggered: bool = False
    risk_level: str = ""        # "imminent" | "high"
    matched_keywords: list[str] = None
    response: str = ""

    def __post_init__(self):
        if self.matched_keywords is None:
            self.matched_keywords = []


# ─── 绝对高危词汇（即刻生命威胁）──────────────────────────────
# 检测到任何一个 → 立即熔断，跳过所有 Agent
IMMINENT_KEYWORDS = [
    # 中文
    "自杀", "想死", "不想活了", "活不下去", "结束生命", "结束自己的生命",
    "割腕", "跳楼", "吃药自杀", "写遗书", "遗书", "活够了",
    "不如死了", "不如死掉", "去死", "死了算了", "死了就好了",
    "没有活下去的意义", "不想活了", "想结束一切",
    "自残", "自伤", "伤害自己",
    # 英文
    "kill myself", "want to die", "end my life", "end it all",
    "suicide", "commit suicide", "take my own life",
    "self-harm", "self harm", "cut myself", "cutting myself",
    "overdose", "jump off", "hang myself",
    "no reason to live", "better off dead", "don't want to live",
    "want to end it", "ending it all",
]

# ─── 高危词汇（需要关注，走 Crisis Agent）────────────────────
# 检测到 → 标记高危，但仍走 Agent 链路（Agent 会更细致处理）
HIGH_RISK_KEYWORDS = [
    # 中文
    "活着没意思", "活着好累", "不想继续了", "撑不下去了",
    "没有意义", "没有希望", "绝望", "崩溃了",
    "一个人扛不住", "太痛苦了", "解脱",
    "消失了就好了", "消失吧",
    # 英文
    "no hope", "hopeless", "give up", "can't go on",
    "falling apart", "breaking down", "can't take it anymore",
    "wish I could disappear", "tired of living",
]

# 编译正则（一次性，高性能）
_imminent_pattern = re.compile(
    "|".join(re.escape(kw) for kw in IMMINENT_KEYWORDS),
    re.IGNORECASE,
)

_high_risk_pattern = re.compile(
    "|".join(re.escape(kw) for kw in HIGH_RISK_KEYWORDS),
    re.IGNORECASE,
)


# ─── 援助热线资源 ──────────────────────────────────────────────
CRISIS_RESOURCES = {
    "zh": {
        "title": "🚨 我很担心你的安全",
        "message": "你现在可能正在经历很大的痛苦。请立即联系专业人员，他们会帮助你：",
        "hotlines": [
            {"name": "全国心理援助热线", "number": "400-161-9995"},
            {"name": "北京心理危机研究与干预中心", "number": "010-82951332"},
            {"name": "希望24热线", "number": "400-161-9995"},
            {"name": "生命热线", "number": "400-821-1215"},
        ],
        "closing": "你不是一个人。请现在就拨打以上电话，有人在等你。",
    },
    "en": {
        "title": "🚨 I'm concerned about your safety",
        "message": "You may be going through immense pain right now. Please reach out to a professional who can help:",
        "hotlines": [
            {"name": "988 Suicide & Crisis Lifeline (US)", "number": "Call/Text 988"},
            {"name": "Crisis Text Line (US)", "number": "Text HOME to 741741"},
            {"name": "Samaritans (UK)", "number": "116 123"},
            {"name": "International Association for Suicide Prevention", "number": "https://www.iasp.info/resources/Crisis_Centres/"},
        ],
        "closing": "You are not alone. Please reach out now — someone is waiting to help you.",
    },
}


def build_crisis_response(lang: str = "zh") -> dict:
    """构建危机响应（直接返回给前端，不经过 LLM）"""
    res = CRISIS_RESOURCES.get(lang, CRISIS_RESOURCES["zh"])

    hotline_text = "\n".join(
        f"  📞 {h['name']}：{h['number']}" for h in res["hotlines"]
    )

    content = (
        f"{res['title']}\n\n"
        f"{res['message']}\n\n"
        f"{hotline_text}\n\n"
        f"{res['closing']}"
    )

    return {
        "agent": "crisis",
        "content": content,
        "suggestions": ["我现在安全了", "我会联系热线", "我需要继续聊聊"],
        "emotion_level": "crisis",
        "metadata": {
            "guardrail_triggered": True,
            "bypass_llm": True,
            "resources": res["hotlines"],
        },
    }


def check_guardrail(text: str) -> GuardrailResult:
    """
    零延迟危机检测（纯正则，<1ms）
    返回 GuardrailResult，triggered=True 时应立即返回危机响应。
    """
    # 1. 绝对高危 → 立即熔断
    imminent_matches = _imminent_pattern.findall(text)
    if imminent_matches:
        lang = "zh" if any(ord(c) > 127 for c in text) else "en"
        return GuardrailResult(
            triggered=True,
            risk_level="imminent",
            matched_keywords=list(set(imminent_matches)),
            response="",  # 由 build_crisis_response 生成
        )

    # 2. 高危 → 标记但不熔断（交给 Crisis Agent 细致处理）
    high_matches = _high_risk_pattern.findall(text)
    if high_matches:
        return GuardrailResult(
            triggered=False,  # 不熔断，交给 Agent
            risk_level="high",
            matched_keywords=list(set(high_matches)),
        )

    return GuardrailResult()
