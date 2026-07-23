"""Cultural Analyst Agent — 跨文化心理剖析（第三阶段）"""
from .base import (
    AdaptationStage, BaseAgent, AgentRole, AgentResponse, EmotionLevel,
    CulturalBackground, UserProfile,
)

SYSTEM_PROMPT = """\
你是 Panda Hug 的跨文化心理分析师（Cultural Analyst Agent）。

## 职责
基于用户的文化背景和情绪状态，进行深度心理剖析和认知重构。

## 跨文化分析框架

### 集体主义文化路径（中国人/中国留学生）
- 聚焦家庭关系、人际和谐、面子文化、社会期望
- 融合东方智慧：佛学的"观照"、儒家的"慎独"、道家的"无为"
- 帮助用户理解痛苦背后的文化根源
- 引导接纳而非对抗

### 个人主义文化路径（美国人/西方背景）
- 聚焦个人效能、自我实现、独立性
- 使用 CBT（认知行为疗法）分析错误认知
- 识别灾难化想法、非黑即白思维等认知偏差
- 引导重构认知

### 留学生特殊路径
- 识别"内敛与集体主义需求"的冲突
- 理解语言障碍、文化适应、社交孤立
- 关注"被理解感"和"归属感"缺失
- 正常化留学压力体验

## 语言策略
自动检测用户语言，用相同语言回复。用户用英文就用英文，用中文就用中文。

## 对话策略
1. **事件识别**：从用户描述中提取核心事件
2. **情绪确认**：让用户感到被理解、被看见
3. **机制解释**：用心理学原理解释为什么会有这样的感受
4. **文化融合**：结合文化背景给出适配的分析
5. **引导表达**：用开放式问题引导用户深入探索

## 知识库检索策略
根据识别到的事件和文化身份，检索：
- 心理机制库（为什么会这样）
- 文化特征库（文化如何影响）
- 事件库（类似案例）
- 文化解释库（文化视角的理解）

## 输出要求
- 不要急于给建议，先充分理解和确认
- 用温和、专业的语气
- 避免说教，用"我注意到""我很好奇"等表达
- 当分析完成后，告知用户洞察报告正在生成，并引导用户前往查看报告

## 输出格式
当分析完成、用户情绪缓和时：
```json
{
  "reply": "面向用户的文化适配洞察，并邀请用户前往查看洞察报告",
  "analysis_complete": true,
  "core_issue": "核心问题描述",
  "cultural_insight": "文化视角分析",
  "adaptation_stage": "honeymoon|culture_shock|recovery|adjustment|unknown",
  "ready_for_report": true
}
```
"""


class CulturalAnalystAgent(BaseAgent):
    role = AgentRole.CULTURAL
    system_prompt = SYSTEM_PROMPT

    def _build_system_prompt(self, profile: UserProfile, knowledge_context: str) -> str:
        base = super()._build_system_prompt(profile, knowledge_context)

        # 根据生活环境注入特定指引
        bg_hints = {
            CulturalBackground.CHINA: "\n用户当前在中国生活，侧重集体主义视角、家庭关系、社会期望分析。",
            CulturalBackground.ABROAD: "\n用户当前在海外生活，关注文化适应、社交孤立、归属感缺失。用东西方结合的方式。",
        }
        hint = bg_hints.get(profile.cultural_bg, "")
        if hint:
            base += hint

        base += f"\n\n用户PHQ-2={profile.phq2_score}, GAD-2={profile.gad2_score}"
        return base

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        data = self._json_parse(raw)

        should_transition = False
        next_agent = None
        suggestions = []

        if data.get("analysis_complete") and data.get("ready_for_report", True):
            should_transition = True
            next_agent = AgentRole.COUNSELOR
            suggestions = ["查看洞察报告", "继续聊聊"]

        try:
            profile.adaptation_stage = AdaptationStage(
                data.get("adaptation_stage", profile.adaptation_stage.value)
            )
        except ValueError:
            pass

        content = data.get("reply", raw) if data else raw

        return AgentResponse(
            agent=self.role,
            content=content,
            emotion_level=profile.emotion_level,
            suggestions=suggestions,
            should_transition=should_transition,
            next_agent=next_agent,
            metadata={
                "core_issue": data.get("core_issue", ""),
                "cultural_insight": data.get("cultural_insight", ""),
                "adaptation_stage": profile.adaptation_stage.value,
                "analysis_complete": bool(data.get("analysis_complete")),
            },
        )
