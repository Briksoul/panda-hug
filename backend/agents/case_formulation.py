"""CaseFormulation Agent V4 — 案例概念化（后台构建心理机制模型）"""
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
    """后台 Agent，由 Orchestrator 直接调用"""
    role = AgentRole.CASE_FORMULATION

    def __init__(self):
        self.client = None

    async def build(self, counseling_data: dict, profile: UserProfile) -> CaseFormulation:
        """从咨询数据构建有深度的案例概念化模型"""
        if not self.client:
            self.client = get_llm()

        # 获取对话历史文本
        history_text = counseling_data.get("history_text", "")
        data_summary = json.dumps(counseling_data, ensure_ascii=False)

        prompt = (
            "你是一位资深的心理案例概念化专家。请根据以下信息，构建一份深入、专业的心理分析模型。\n\n"
            "## 分析框架\n"
            "请从以下维度进行深度分析：\n\n"
            "1. **核心事件**：用户经历了什么？不要泛泛而谈，要具体到事件本身。\n\n"
            "2. **核心情绪**：不是简单的'焦虑'或'难过'，要区分表层情绪和深层情绪。"
            "比如：表层是愤怒，深层可能是受伤和失望。\n\n"
            "3. **自动思维**：用户在事件中产生了什么自动化想法？"
            "常见的认知偏差包括：灾难化思维、非黑即白、过度概括、读心术、应该思维等。\n\n"
            "4. **行为模式**：用户如何应对压力？是回避、压抑、过度补偿、还是寻求支持？\n\n"
            "5. **社会支持**：用户身边有没有可以依靠的人？关系质量如何？\n\n"
            "6. **心理机制**：识别深层的心理动力学机制，如：\n"
            "   - 习得性无助\n"
            "   - 完美主义\n"
            "   - 冒名顶替综合征\n"
            "   - 依恋模式\n"
            "   - 自我价值感与成就绑定\n"
            "   - 文化压力与个人需求的冲突\n\n"
            "7. **机制链**：将以上分析串联成一条因果链：\n"
            "   事件 → 认知解读 → 情绪反应 → 行为模式 → 结果 → 强化认知\n\n"
            "## 对话历史\n"
            f"{history_text}\n\n"
            "## 补充数据\n"
            f"{data_summary}\n\n"
            f"用户文化背景：{profile.cultural_bg.value}\n\n"
            "请分析并返回JSON：\n"
            "{\n"
            '  "core_event": "具体的核心事件",\n'
            '  "core_emotions": ["表层情绪", "深层情绪"],\n'
            '  "auto_thoughts": ["自动思维1: 认知偏差类型", "自动思维2"],\n'
            '  "behavior_pattern": "行为应对模式",\n'
            '  "social_support": "社会支持情况",\n'
            '  "psychological_mechanisms": ["机制1: 详细解释", "机制2: 详细解释"],\n'
            '  "mechanism_chain": "事件→认知→情绪→行为→结果的完整链条",\n'
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
                max_tokens=1000,
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

        # 降级
        return CaseFormulation(
            core_event=counseling_data.get("core_event", "用户正在经历一些困扰"),
            core_emotions=[counseling_data.get("core_emotion", "需要更多了解")],
            auto_thoughts=counseling_data.get("auto_thoughts", []),
            behavior_pattern=counseling_data.get("behavior_pattern", ""),
            social_support=counseling_data.get("social_support", ""),
            risk_level=counseling_data.get("risk_level", "low"),
            completeness=0.3,
        )
