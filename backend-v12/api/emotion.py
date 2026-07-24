"""Transcript emotion analysis for browser voice input."""
from __future__ import annotations

import json
import re

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from auth import get_current_user
from config import config
from database import User

router = APIRouter()

ALLOWED_EMOTIONS = {
    "anger",
    "anxiety",
    "calmness",
    "confusion",
    "disappointment",
    "distress",
    "fear",
    "interest",
    "joy",
    "sadness",
    "satisfaction",
    "tiredness",
}

EMOTION_PROMPT = """You analyze emotional cues expressed in text.
Return one JSON object whose keys are selected only from this list:
anger, anxiety, calmness, confusion, disappointment, distress, fear,
interest, joy, sadness, satisfaction, tiredness.

Each value must be a number from 0 to 1. Include only emotions supported by
the wording and recent context. This is a text inference, not vocal-prosody,
voiceprint, diagnosis, or independent crisis assessment. Return JSON only."""


class EmotionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    history: list[str] = Field(default_factory=list, max_length=10)


class EmotionResponse(BaseModel):
    emotions: dict[str, float]
    dominant: str
    risk_level: str
    analysis_source: str = "gemini_text"


def _parse_scores(raw: str) -> dict[str, float]:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("model did not return a JSON object")
    payload = json.loads(match.group(0))
    if not isinstance(payload, dict):
        raise ValueError("emotion response must be an object")

    scores = {}
    for name, value in payload.items():
        if name not in ALLOWED_EMOTIONS or isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            scores[name] = round(max(0.0, min(1.0, float(value))), 4)
    if not scores:
        raise ValueError("model returned no valid emotion scores")
    return scores


@router.post("/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion(
    req: EmotionRequest,
    _user: User = Depends(get_current_user),
):
    """Infer emotion scores from a transcript with the configured Flash model."""
    recent_context = "\n".join(line[:1000] for line in req.history[-6:])
    user_content = (
        f"Recent conversation:\n{recent_context}\n\nCurrent user transcript:\n{req.text}"
        if recent_context
        else f"Current user transcript:\n{req.text}"
    )
    client = AsyncOpenAI(
        api_key=config.OPENAI_API_KEY,
        base_url=config.OPENAI_BASE_URL,
        timeout=12.0,
    )

    try:
        response = await client.chat.completions.create(
            model=config.EMOTION_MODEL,
            messages=[
                {"role": "system", "content": EMOTION_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.1,
            max_tokens=300,
        )
        raw = response.choices[0].message.content or ""
        emotions = _parse_scores(raw)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Text emotion analysis is temporarily unavailable",
        ) from exc

    dominant = max(emotions, key=emotions.get)
    risk_score = max(
        emotions.get("distress", 0.0),
        emotions.get("sadness", 0.0) * 0.8,
        emotions.get("anxiety", 0.0) * 0.7,
        emotions.get("fear", 0.0) * 0.7,
        emotions.get("anger", 0.0) * 0.4,
    )
    risk_level = "high" if risk_score >= 0.75 else "medium" if risk_score >= 0.45 else "low"
    return EmotionResponse(
        emotions=emotions,
        dominant=dominant,
        risk_level=risk_level,
    )
