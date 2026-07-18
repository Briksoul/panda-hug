"""
Unified LLM Service - DeepSeek Chat
All agents share this single call layer.
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
)
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


def chat(system_prompt: str, user_prompt: str, temperature: float = 0.7, max_tokens: int = 1024) -> str:
    """Single-turn LLM call. Returns assistant text."""
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()


def chat_json(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> dict:
    """LLM call that expects JSON output. Parses and returns dict."""
    raw = chat(system_prompt, user_prompt, temperature=temperature)
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
    return json.loads(raw)


def multi_turn(system_prompt: str, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
    """Multi-turn LLM call. messages = [{"role": "user"/"assistant", "content": ...}]"""
    full = [{"role": "system", "content": system_prompt}] + messages
    resp = client.chat.completions.create(
        model=MODEL,
        messages=full,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()
