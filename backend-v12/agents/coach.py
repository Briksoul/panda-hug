"""Coach Agent — 双元实操干预（第四阶段）"""
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, CulturalBackground,
    UserProfile,
)

SYSTEM_PROMPT = """\
你是 Panda Hug 的心理训练教练（Coach Agent）。

## 职责
引导用户进行身心融合训练，将抽象的心理学智慧转化为具象的生理调节。

## 训练方案库

### 高焦虑（GAD-2 ≥ 4）
1. **生理叹息** — 双重吸气后缓慢呼气，帮助快速降低生理唤醒
2. **感官着陆** — 使用视觉、触觉与听觉线索回到当下

### 中等焦虑（GAD-2 2-3）
1. **感官着陆** — 从外部环境中寻找稳定线索
2. **身体扫描** — 依次觉察并放松身体各部位

### 低落/抑郁（PHQ-2 ≥ 4）
1. **微行为激活** — 设定一个足够小且可以立即完成的行动
2. **联结感回溯** — 回忆被理解、支持与陪伴的具体时刻
3. **音乐疗愈** — 使用舒缓音乐调节情绪状态

### 轻微不适
1. **身体扫描** — 温和觉察身体感受
2. **音乐疗愈** — 为身心留出短暂恢复空间

## 语言策略
自动检测用户语言，用相同语言回复。

## 对话策略
1. **介绍训练**：解释为什么推荐这个训练
2. **逐步引导**：一步步引导用户完成
3. **实时反馈**：询问用户感受（"呼吸顺畅吗？""感觉到放松了吗？"）
4. **正向强化**：肯定用户的每一步努力
5. **效果评估**：训练后询问改善程度

## 训练反馈问题模板
- "你现在调整呼吸的速度顺畅吗？"
- "感觉到重心下沉了吗？"
- "肩膀放松了吗？"
- "现在的感受和刚才相比有什么变化？"

## 输出格式
训练完成时：
```json
{
  "reply": "面向用户的训练总结和鼓励",
  "training_complete": true,
  "technique": "使用的训练技术",
  "user_feedback": "用户反馈摘要",
  "improvement": "改善程度描述"
}
```
"""


class CoachAgent(BaseAgent):
    role = AgentRole.COACH
    system_prompt = SYSTEM_PROMPT
    model_tier = "fast"

    def _build_system_prompt(self, profile: UserProfile, knowledge_context: str) -> str:
        base = super()._build_system_prompt(profile, knowledge_context)

        # 根据情绪等级推荐训练
        if profile.emotion_level in (EmotionLevel.SEVERE, EmotionLevel.MODERATE):
            if profile.gad2_score >= 4:
                base += "\n\n用户焦虑程度较高，优先推荐生理叹息或感官着陆。"
            elif profile.phq2_score >= 4:
                base += "\n\n用户低落情绪明显，优先推荐微行为激活或联结感回溯。"
        elif profile.emotion_level == EmotionLevel.MILD:
            base += "\n\n用户情绪轻微不适，推荐身体扫描或音乐疗愈。"

        # 文化适配
        if profile.cultural_bg == CulturalBackground.CHINA:
            base += "\n用户有中国文化背景，可融入东方元素（太极、古琴、佛学正念等）。"

        return base

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        data = self._json_parse(raw)

        suggestions = []
        should_transition = False

        if data.get("training_complete"):
            suggestions = ["感觉好多了", "还需要帮助", "换个训练"]
            should_transition = True

        content = data.get("reply", raw) if data else raw

        return AgentResponse(
            agent=self.role,
            content=content,
            emotion_level=profile.emotion_level,
            suggestions=suggestions,
            should_transition=should_transition,
            next_agent=AgentRole.COUNSELOR if should_transition else None,
            metadata={
                "training_complete": bool(data.get("training_complete")),
                "technique": data.get("technique", ""),
                "user_feedback": data.get("user_feedback", ""),
                "improvement": data.get("improvement", ""),
            },
        )
