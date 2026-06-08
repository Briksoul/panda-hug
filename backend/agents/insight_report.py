"""Insight Report Agent V4 — 心理洞察报告生成（阶段3：看见自己）"""
from __future__ import annotations
import json
import re
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
    get_llm, config,
)


class InsightReportAgent:
    """生成5模块心理洞察报告"""
    role = AgentRole.INSIGHT_REPORT

    def __init__(self):
        self.client = None

    async def generate(
        self,
        case_formulation: dict,
        cultural_analysis: dict,
        profile: UserProfile,
        history_text: str = "",
    ) -> dict:
        """生成有深度、有现实意义的心理洞察报告"""
        if not self.client:
            self.client = get_llm()

        prompt = (
            "你是心理洞察分析师。根据用户对话和分析数据，生成JSON格式报告。\n\n"
            f"对话历史：{history_text}\n\n"
            f"文化背景：{profile.cultural_bg.value}，PHQ-2：{profile.phq2_score}，GAD-2：{profile.gad2_score}，状态：{profile.bear_status.value}\n\n"
            f"分析数据：{json.dumps(case_formulation, ensure_ascii=False)}\n\n"
            "返回JSON（字段值保持简短）：\n"
            '{"bear_status":{"emoji":"🐻","label":"状态标签","description":"简短描述"},'
            '"what_happened":{"timeline":["事件"],"summary":"概述"},'
            '"why_this_happens":{"psychological_mechanisms":["机制"],"cultural_influence":"文化影响","explanation":"分析"},'
            '"what_i_need":{"core_needs":["需求"],"suggestions":["建议"]},'
            '"bear_message":"温暖寄语","training_recommendation":"推荐"}'
            "\n只返回JSON。"
        )

        try:
            resp = await self.client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=2000,
            )
            raw = resp.choices[0].message.content or "{}"
            print(f"[InsightReport] Raw ({len(raw)} chars): {raw[:200]}")
            # 提取JSON（处理markdown代码块）
            m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
            if m:
                return json.loads(m.group(1))
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
            print(f"[InsightReport] No JSON found in response")
        except Exception as e:
            print(f"[InsightReport] Error: {type(e).__name__}: {e}")
            pass

        # 降级报告
        return {
            "bear_status": {
                "emoji": "🐻",
                "label": "需要关注",
                "description": "当前存在一定的情绪困扰，建议继续关注自己的心理状态",
            },
            "what_happened": {
                "timeline": [],
                "summary": "感谢你愿意分享，我们已经收集到一些信息",
            },
            "why_this_happens": {
                "psychological_mechanisms": ["你正在经历的压力和情绪是真实且合理的"],
                "cultural_influence": "",
                "explanation": "每个人的心理状态都是多种因素交织的结果，理解自己是改变的第一步",
            },
            "what_i_need": {
                "core_needs": ["被理解", "情绪支持"],
                "suggestions": ["继续和信任的人分享你的感受", "尝试一些放松练习"],
            },
            "bear_message": "你已经迈出了重要的一步——愿意面对自己的感受。这本身就是勇气。接下来，让我们一起照顾好自己。",
            "training_recommendation": "建议从呼吸训练或正念冥想开始",
        }
