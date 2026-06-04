"""Triage Agent — 初筛分流（第一阶段）"""
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel,
    CulturalBackground, UserProfile,
)

SYSTEM_PROMPT = """\
你是 Panda Hug 的接待与初筛 Agent（Triage Agent）。

## 职责
1. 用温暖、自然的语气欢迎用户
2. 通过对话式问询完成 PHQ-2 和 GAD-2 筛查
3. 确认用户的文化身份背景
4. 根据评估结果进行情绪分级

## PHQ-2（抑郁筛查）
请根据过去两周的情况作答：
1. 做事情缺乏兴趣或乐趣
2. 感到情绪低落、沮丧或绝望
评分：0=完全没有 1=好几天 2=一半以上天 3=几乎每天

## GAD-2（焦虑筛查）
请根据过去两周的情况作答：
1. 感到紧张、焦虑或心神不宁
2. 无法停止或控制担忧
评分：0=完全没有 1=好几天 2=一半以上天 3=几乎每天

## 文化背景确认
自然地询问用户当前的生活环境：
- 在中国生活
- 在海外生活

不要直接问'你是哪国人'，而是通过聊天自然了解。例如：'你现在在哪里生活呀？'

注意：无论用户回答什么国籍，都根据其当前生活环境来适配分析路径。

## 情绪分级规则
- 两个量表总分均 0-1 → positive（积极）
- 其中一个量表总分 2-3 → mild（轻微）
- 其中一个量表总分 4-6 → moderate（中等）
- 发现危机信号 → crisis（危机）

## 对话策略
- 不要一次性问所有问题，自然地逐步问询
- 用小熊表情增加亲切感
- 完成评估后告知结果，并询问是否要进一步聊天

## 语言策略
自动检测用户使用的语言，用相同的语言回复。如果用户用英文，就用英文回复；用中文就用中文；以此类推。不要主动切换语言，除非用户先切换。

## 输出格式
当评估完成时，用 JSON 块输出：
```json
{
  "phq2_score": 0,
  "gad2_score": 0,
  "cultural_bg": "chinese_student",
  "emotion_level": "mild",
  "summary": "评估摘要"
}
```
正常对话时直接输出自然语言即可。
"""


class TriageAgent(BaseAgent):
    role = AgentRole.TRIAGE
    system_prompt = SYSTEM_PROMPT

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        data = self._json_parse(raw)

        if data:
            # 评估完成
            profile.phq2_score = data.get("phq2_score", profile.phq2_score)
            profile.gad2_score = data.get("gad2_score", profile.gad2_score)

            bg = data.get("cultural_bg", "")
            # 兼容旧值映射
            bg_map = {
                "chinese": "china", "chinese_student": "abroad",
                "american": "abroad", "international": "abroad",
            }
            bg = bg_map.get(bg, bg)
            try:
                profile.cultural_bg = CulturalBackground(bg)
            except ValueError:
                pass

            el = data.get("emotion_level", "")
            try:
                profile.emotion_level = EmotionLevel(el)
            except ValueError:
                pass

            # 判断是否需要转介
            next_agent = None
            should_transition = False
            if profile.emotion_level == EmotionLevel.CRISIS:
                next_agent = AgentRole.CRISIS
                should_transition = True
            elif profile.phq2_score + profile.gad2_score > 0:
                # 有任何症状 → 进入文化分析
                suggestions = [
                    "视频咨询", "语音咨询", "文字咨询", "已解决，不需要"
                ]
                return AgentResponse(
                    agent=self.role,
                    content=raw,
                    emotion_level=profile.emotion_level,
                    suggestions=suggestions,
                    should_transition=False,  # 等用户选择后再切换
                    metadata={"phase": "assessment_complete"},
                )

            return AgentResponse(
                agent=self.role,
                content=raw,
                emotion_level=profile.emotion_level,
                should_transition=should_transition,
                next_agent=next_agent,
                metadata={"phase": "assessing"},
            )

        # 普通对话
        return AgentResponse(
            agent=self.role,
            content=raw,
            metadata={"phase": "assessing"},
        )
