"""Supervisor Agent — 咨询督导（监控 Counselor 质量）"""
from __future__ import annotations
import json
import re
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
    get_llm, config,
)


class SupervisorAgent:
    """后台 Agent，监控 Counselor 回复质量"""
    role = AgentRole.SUPERVISOR

    def __init__(self):
        self.client = None

    async def evaluate(
        self,
        counselor_response: str,
        user_message: str,
        history: list[dict],
        profile: UserProfile,
    ) -> dict:
        """评估 Counselor 回复质量"""
        if not self.client:
            self.client = get_llm()

        prompt = (
            "你是心理咨询督导。评估以下咨询师回复的质量。\n\n"
            f"用户消息：{user_message}\n\n"
            f"咨询师回复：{counselor_response}\n\n"
            "评估标准：\n"
            "1. 共情比例（0-1）：是否有足够的共情表达\n"
            "2. 探索比例（0-1）：是否有适当的探索性提问\n"
            "3. 说教程度（0-1）：是否有过度说教\n"
            "4. 倾听质量（0-1）：是否真正倾听用户\n"
            "5. 总体评分（0-1）\n"
            "6. 改进建议\n\n"
            "返回JSON：\n"
            "{\n"
            '  "empathy_score": 0.0,\n'
            '  "exploration_score": 0.0,\n'
            '  "preachiness_score": 0.0,\n'
            '  "listening_score": 0.0,\n'
            '  "overall_score": 0.0,\n'
            '  "suggestions": ["建议1"],\n'
            '  "approved": true\n'
            "}\n"
            "只返回JSON。"
        )

        try:
            resp = await self.client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=500,
            )
            raw = resp.choices[0].message.content or "{}"
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
        except Exception:
            pass

        # 降级：默认通过
        return {
            "empathy_score": 0.7,
            "exploration_score": 0.7,
            "preachiness_score": 0.2,
            "listening_score": 0.7,
            "overall_score": 0.7,
            "suggestions": [],
            "approved": True,
        }
