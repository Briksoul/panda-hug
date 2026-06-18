"""Insight Report Agent V5 — 双视角心理洞察报告生成（阶段3：看见自己）"""
from __future__ import annotations
import json
import re
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
    get_llm, config,
)


class InsightReportAgent:
    """生成 V5 双视角（东方+西方）心理洞察报告"""
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
        """生成有深度、有现实意义的双视角心理洞察报告"""
        if not self.client:
            self.client = get_llm()

        # V5: 双视角 prompt — 基于文化框架转换理论（CFS）
        prompt = (
            "你是心理洞察分析师。根据用户对话和分析数据，生成JSON格式报告。\n\n"
            "## V5 双视角要求\n"
            "基于文化框架转换理论（Cultural Frame Switching, CFS），你需要从两个视角解读用户的经历：\n"
            "1. **东方视角**：关系导向、集体主义、家庭和谐、面子文化、忍耐与坚韧\n"
            "2. **西方视角**：自主独立、个人主义、自我表达、心理健康意识、边界设定\n\n"
            "两种视角都是合理的，不是评判哪个更好，而是帮助用户看到多元解读的可能性。\n\n"
            f"对话历史：{history_text}\n\n"
            f"文化背景：{profile.cultural_bg.value}，PHQ-2：{profile.phq2_score}，GAD-2：{profile.gad2_score}，"
            f"状态：{profile.bear_status.value}，留学时长：{profile.study_abroad_months}个月，"
            f"U型曲线阶段：{profile.u_curve_stage.value}\n\n"
            f"分析数据：{json.dumps(case_formulation, ensure_ascii=False)}\n\n"
            "返回JSON（字段值保持简短，但要有深度）：\n"
            '{"bear_status":{"emoji":"🐻","label":"状态标签","description":"简短描述"},'
            '"what_happened":{"timeline":["事件"],"summary":"概述"},'
            '"why_this_happens":{'
            '"eastern_view":{"mechanisms":["东方视角机制"],"interpretation":"东方视角解读"},'
            '"western_view":{"mechanisms":["西方视角机制"],"interpretation":"西方视角解读"},'
            '"synthesis":"综合理解：两种视角如何帮助你更全面地看待自己"'
            '},'
            '"what_i_need":{"core_needs":["需求"],"suggestions":["建议"]},'
            '"bear_message":"温暖寄语",'
            '"u_curve_info":{"stage":"当前阶段","description":"阶段说明","tip":"适应建议"},'
            '"training_recommendation":"推荐"}'
            "\n只返回JSON。"
        )

        try:
            resp = await self.client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=2500,
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

        # 降级报告（V5 双视角格式）
        return self._fallback_report(profile)

    def _fallback_report(self, profile: UserProfile) -> dict:
        """V5 降级报告 — 保持双视角结构"""
        is_zh = profile.language.value == "zh"
        return {
            "bear_status": {
                "emoji": "🐻",
                "label": "需要关注" if is_zh else "Needs Attention",
                "description": "当前存在一定的情绪困扰，建议继续关注自己的心理状态" if is_zh else "Some emotional distress detected",
            },
            "what_happened": {
                "timeline": [],
                "summary": "感谢你愿意分享，我们已经收集到一些信息" if is_zh else "Thank you for sharing",
            },
            "why_this_happens": {
                "eastern_view": {
                    "mechanisms": ["你正在经历的压力是很多留学生都会遇到的" if is_zh else "Your stress is common among international students"],
                    "interpretation": "从东方视角看，你的忍耐和坚持本身就是一种力量" if is_zh else "From an Eastern perspective, your resilience is itself a strength",
                },
                "western_view": {
                    "mechanisms": ["情绪的波动是正常的身心反应" if is_zh else "Emotional fluctuation is a normal response"],
                    "interpretation": "从西方视角看，关注自己的情绪健康是非常重要的自我关爱" if is_zh else "From a Western perspective, attending to emotional health is vital self-care",
                },
                "synthesis": "两种视角都指向同一个事实：你的感受是真实的，值得关注" if is_zh else "Both perspectives affirm: your feelings are real and worthy of attention",
            },
            "what_i_need": {
                "core_needs": ["被理解" if is_zh else "To be understood", "情绪支持" if is_zh else "Emotional support"],
                "suggestions": ["继续和信任的人分享你的感受" if is_zh else "Keep sharing with trusted people", "尝试一些放松练习" if is_zh else "Try relaxation exercises"],
            },
            "bear_message": "你已经迈出了重要的一步——愿意面对自己的感受。这本身就是勇气。" if is_zh else "You've taken an important step — facing your feelings. That itself is courage.",
            "u_curve_info": {
                "stage": profile.u_curve_stage.value,
                "description": "每个人的文化适应都有自己的节奏" if is_zh else "Everyone adapts at their own pace",
                "tip": "给自己一些时间和耐心" if is_zh else "Give yourself time and patience",
            },
            "training_recommendation": "建议从呼吸训练或正念冥想开始" if is_zh else "Start with breathing or mindfulness",
        }

    async def generate_stream(
        self,
        case_formulation: dict,
        cultural_analysis: dict,
        profile: UserProfile,
        history_text: str = "",
    ):
        """V5: SSE 流式生成报告 — 逐段推送给前端"""
        if not self.client:
            self.client = get_llm()

        # 先生成完整报告
        report = await self.generate(case_formulation, cultural_analysis, profile, history_text)

        # 按模块逐段 yield
        sections = [
            ("bear_status", report.get("bear_status", {})),
            ("what_happened", report.get("what_happened", {})),
            ("why_this_happens", report.get("why_this_happens", {})),
            ("what_i_need", report.get("what_i_need", {})),
            ("bear_message", report.get("bear_message", "")),
            ("u_curve_info", report.get("u_curve_info", {})),
            ("training_recommendation", report.get("training_recommendation", "")),
        ]

        import asyncio
        for section_name, section_data in sections:
            yield {
                "type": "section",
                "name": section_name,
                "data": section_data,
            }
            await asyncio.sleep(0.3)  # 模拟流式延迟

        yield {"type": "complete", "report": report}
