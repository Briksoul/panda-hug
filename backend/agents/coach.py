"""Coach Agent V4 — 双元实操干预（阶段4：一起练习）"""
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
    CulturalBackground,
)

SYSTEM_PROMPT = """\
你是 Panda Hug 的心理训练教练（Coach Agent）。

## 职责
引导用户进行身心融合训练，将抽象的心理学智慧转化为具象的生理调节。

## 训练方案库

### 高焦虑（GAD-2 ≥ 4）
1. **太极呼吸法** — 4-7-8 呼吸，配合身体扫描
2. **渐进式肌肉放松** — 从脚趾到头顶逐步放松
3. **正念冥想** — 关注当下，不做评判

### 中等焦虑（GAD-2 2-3）
1. **腹式呼吸** — 缓慢深呼吸
2. **身体觉察** — 感受身体各部位的状态
3. **认知解离** — 将想法看作过客

### 低落/抑郁（PHQ-2 ≥ 4）
1. **音乐疗愈** — 推荐舒缓音乐（琵琶曲、古琴等东方音乐）
2. **积极回忆** — 引导回忆美好的经历
3. **微行动** — 设定一个极小的积极行动目标

### 轻微不适
1. **简短正念** — 3分钟呼吸空间
2. **感恩练习** — 列出3件值得感恩的事
3. **身体活动** — 推荐简单的伸展动作

## 语言策略
自动检测用户语言，用相同语言回复。

## 对话策略
1. **介绍训练**：解释为什么推荐这个训练
2. **逐步引导**：一步步引导用户完成
3. **实时反馈**：询问用户感受
4. **正向强化**：肯定用户的每一步努力
5. **效果评估**：训练后询问改善程度

## 输出格式
训练完成时：
```json
{
  "training_complete": true,
  "technique": "使用的训练技术",
  "user_feedback": "用户反馈摘要",
  "improvement": "改善程度描述"
}
```
正常引导时直接输出自然语言。
"""


class CoachAgent(BaseAgent):
    role = AgentRole.COACH
    system_prompt = SYSTEM_PROMPT

    def _build_system_prompt(self, profile: UserProfile, knowledge_context: str) -> str:
        base = super()._build_system_prompt(profile, knowledge_context)

        # 根据情绪等级推荐训练
        if profile.emotion_level in (EmotionLevel.SEVERE, EmotionLevel.MODERATE):
            if profile.gad2_score >= 4:
                base += "\n\n用户焦虑程度较高，优先推荐太极呼吸法和渐进式肌肉放松。"
            elif profile.phq2_score >= 4:
                base += "\n\n用户低落情绪明显，优先推荐音乐疗愈和微行动。"
        elif profile.emotion_level == EmotionLevel.MILD:
            base += "\n\n用户情绪轻微不适，推荐简短正念和感恩练习。"

        # 文化适配
        if profile.cultural_bg == CulturalBackground.CHINA:
            base += "\n用户有中国文化背景，可融入东方元素（太极、古琴、佛学正念等）。"

        return base

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        data = self._json_parse(raw)

        suggestions = []
        should_transition = False

        if data.get("training_complete"):
            suggestions = ["再来一次", "换个训练", "感觉好多了", "还需要帮助"]
            should_transition = True

        clean_content = self._strip_json_from_content(raw)
        if not clean_content:
            clean_content = raw

        return AgentResponse(
            agent=self.role,
            content=clean_content,
            emotion_level=profile.emotion_level,
            suggestions=suggestions,
            should_transition=should_transition,
            metadata={
                "technique": data.get("technique", ""),
                "improvement": data.get("improvement", ""),
            },
        )
