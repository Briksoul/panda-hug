"""文本情绪分析 API — 替代 Hume prosody，用 Gemini 分析对话情绪"""
import json
from fastapi import APIRouter
from pydantic import BaseModel
from openai import AsyncOpenAI
from config import config

router = APIRouter()

# 情绪分析 prompt
EMOTION_PROMPT = """分析以下对话文本中的用户情绪。返回 JSON 格式的情绪分数（0-1）。

支持的情绪维度：
- joy（快乐）
- sadness（悲伤）
- anxiety（焦虑）
- anger（愤怒）
- calm（平静）
- hopelessness（绝望）
- loneliness（孤独）
- stress（压力）

只返回 JSON，不要其他文字。示例：
{"joy": 0.2, "anxiety": 0.7, "sadness": 0.5}

对话文本：
"""


class EmotionRequest(BaseModel):
    text: str
    history: list[str] = []  # 最近几轮对话


class EmotionResponse(BaseModel):
    emotions: dict[str, float]
    dominant: str  # 主要情绪
    risk_level: str  # low | medium | high


@router.post("/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion(req: EmotionRequest):
    """分析文本情绪，返回情绪分数和风险等级"""
    client = AsyncOpenAI(
        api_key=config.OPENAI_API_KEY,
        base_url=config.OPENAI_BASE_URL,
    )

    # 拼接最近对话上下文
    context = "\n".join(req.history[-5:]) if req.history else ""
    prompt = EMOTION_PROMPT + f"\n{context}\n用户: {req.text}" if context else EMOTION_PROMPT + req.text

    try:
        response = await client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200,
        )
        raw = response.choices[0].message.content.strip()
        # 提取 JSON
        if "```" in raw:
            raw = raw.split("```")[1].strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()
        emotions = json.loads(raw)

        # 计算主要情绪
        dominant = max(emotions, key=emotions.get) if emotions else "calm"

        # 计算风险等级
        risk_score = (
            emotions.get("hopelessness", 0) * 1.5 +
            emotions.get("sadness", 0) * 0.8 +
            emotions.get("anxiety", 0) * 0.6 +
            emotions.get("anger", 0) * 0.4
        )
        if risk_score > 0.7:
            risk_level = "high"
        elif risk_score > 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"

        return EmotionResponse(
            emotions=emotions,
            dominant=dominant,
            risk_level=risk_level,
        )

    except Exception as e:
        # 解析失败时返回默认值
        return EmotionResponse(
            emotions={"calm": 0.5},
            dominant="calm",
            risk_level="low",
        )
