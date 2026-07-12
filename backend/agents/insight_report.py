"""InsightReport Agent — 心理洞察报告生成"""
from __future__ import annotations
import json
import re
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
    get_llm, config,
)


class InsightReportAgent:
    """生成图文心理洞察报告"""
    role = AgentRole.INSIGHT_REPORT

    def __init__(self):
        self.client = None

    async def generate(
        self,
        case_formulation: dict,
        cultural_analysis: dict,
        profile: UserProfile,
    ) -> dict:
        """生成心理洞察报告（7个模块）"""
        if not self.client:
            self.client = get_llm()

        prompt = (
            "你是心理洞察报告生成专家。根据以下数据生成一份温暖、专业的心理洞察报告。\n\n"
            f"案例概念化：\n{json.dumps(case_formulation, ensure_ascii=False)}\n\n"
            f"文化分析：\n{json.dumps(cultural_analysis, ensure_ascii=False)}\n\n"
            f"用户文化背景：{profile.cultural_bg.value}\n"
            f"PHQ-2分数：{profile.phq2_score}, GAD-2分数：{profile.gad2_score}\n\n"
            "请生成包含以下7个模块的报告，返回JSON：\n"
            "{\n"
            '  "bear_status": {\n'
            '    "emoji": "🐻",\n'
            '    "label": "疲惫小熊",\n'
            '    "description": "当前状态描述"\n'
            "  },\n"
            '  "what_happened": {\n'
            '    "timeline": ["事件1", "事件2"],\n'
            '    "summary": "事件概述"\n'
            "  },\n"
            '  "why_this_happens": {\n'
            '    "psychological_mechanisms": ["机制1"],\n'
            '    "cultural_influence": "文化影响分析",\n'
            '    "explanation": "综合解释"\n'
            "  },\n"
            '  "cultural_adaptation": {\n'
            f'    "stage": "{profile.adaptation_stage.value}",\n'
            '    "label": "文化适应阶段名称",\n'
            '    "evidence": ["判断依据1"],\n'
            '    "support": "该阶段适合的文化支持"\n'
            "  },\n"
            '  "what_i_need": {\n'
            '    "core_needs": ["归属感", "情绪表达空间"],\n'
            '    "suggestions": ["建议1"]\n'
            "  },\n"
            '  "intervention_plan": {\n'
            '    "long_term": ["长期建议1"],\n'
            '    "immediate": ["当下可执行建议1"],\n'
            '    "training_recommendation": "训练推荐建议"\n'
            "  },\n"
            '  "bear_message": "温暖的小熊寄语"\n'
            "}\n"
            "只返回JSON。用温暖、非评判性的语言。"
        )

        try:
            resp = await self.client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=4096,
            )
            raw = resp.choices[0].message.content or "{}"
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
        except Exception:
            pass

        # 降级报告
        return {
            "bear_status": {
                "emoji": "🐻",
                "label": "需要关注",
                "description": "当前存在一定的情绪困扰",
            },
            "what_happened": {
                "timeline": [],
                "summary": "暂无足够信息",
            },
            "why_this_happens": {
                "psychological_mechanisms": [],
                "cultural_influence": "",
                "explanation": "需要更多咨询数据来生成完整分析",
            },
            "cultural_adaptation": {
                "stage": profile.adaptation_stage.value,
                "label": "文化适应阶段待进一步了解",
                "evidence": [],
                "support": "继续关注文化差异带来的感受和实际困难。",
            },
            "what_i_need": {
                "core_needs": ["情绪支持"],
                "suggestions": ["继续咨询"],
            },
            "intervention_plan": {
                "long_term": ["持续记录情绪变化"],
                "immediate": ["尝试一次简短的呼吸练习"],
                "training_recommendation": "建议尝试呼吸训练或正念练习",
            },
            "bear_message": "你已经迈出了重要的一步，接下来让我们一起照顾好自己。",
        }
