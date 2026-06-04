"""CaseFormulation Agent — 案例概念化（后台构建心理机制模型）"""
from __future__ import annotations
import json
import re
from dataclasses import dataclass, field
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
    get_llm, config,
)


@dataclass
class CaseFormulation:
    """案例概念化模型"""
    core_event: str = ""
    core_emotions: list[str] = field(default_factory=list)
    auto_thoughts: list[str] = field(default_factory=list)
    behavior_pattern: str = ""
    social_support: str = ""
    psychological_mechanisms: list[str] = field(default_factory=list)
    mechanism_chain: str = ""  # 事件→认知→情绪→行为→结果
    risk_level: str = "low"
    completeness: float = 0.0  # 0-1，信息收集完整度


class CaseFormulationAgent:
    """后台 Agent，无需 system_prompt（由 Orchestrator 直接调用）"""
    role = AgentRole.CASE_FORMULATION

    def __init__(self):
        self.client = None

    async def build(self, counseling_data: dict, profile: UserProfile) -> CaseFormulation:
        """从咨询数据构建案例概念化模型"""
        if not self.client:
            self.client = get_llm()

        prompt = (
            "你是心理案例概念化专家。根据以下咨询数据，构建完整的心理机制模型。\n\n"
            f"咨询数据：\n{json.dumps(counseling_data, ensure_ascii=False)}\n\n"
            f"用户文化背景：{profile.cultural_bg.value}\n\n"
            "请分析并返回JSON：\n"
            "{\n"
            '  "core_event": "核心事件",\n'
            '  "core_emotions": ["情绪1", "情绪2"],\n'
            '  "auto_thoughts": ["自动思维1"],\n'
            '  "behavior_pattern": "行为模式",\n'
            '  "social_support": "社会支持情况",\n'
            '  "psychological_mechanisms": ["机制1: 说明"],\n'
            '  "mechanism_chain": "事件→认知→情绪→行为→结果",\n'
            '  "risk_level": "low|medium|high",\n'
            '  "completeness": 0.0-1.0\n'
            "}\n"
            "只返回JSON。"
        )

        try:
            resp = await self.client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=800,
            )
            raw = resp.choices[0].message.content or "{}"
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                data = json.loads(m.group(0))
                return CaseFormulation(
                    core_event=data.get("core_event", ""),
                    core_emotions=data.get("core_emotions", []),
                    auto_thoughts=data.get("auto_thoughts", []),
                    behavior_pattern=data.get("behavior_pattern", ""),
                    social_support=data.get("social_support", ""),
                    psychological_mechanisms=data.get("psychological_mechanisms", []),
                    mechanism_chain=data.get("mechanism_chain", ""),
                    risk_level=data.get("risk_level", "low"),
                    completeness=data.get("completeness", 0.0),
                )
        except Exception:
            pass

        # 降级：直接从 counseling_data 构建
        return CaseFormulation(
            core_event=counseling_data.get("core_event", ""),
            core_emotions=[counseling_data.get("core_emotion", "")],
            auto_thoughts=counseling_data.get("auto_thoughts", []),
            behavior_pattern=counseling_data.get("behavior_pattern", ""),
            social_support=counseling_data.get("social_support", ""),
            risk_level=counseling_data.get("risk_level", "low"),
            completeness=0.5,
        )
