"""Risk Agent — 危机监测（专业化，基于 Columbia Suicide Scale）"""
from .base import (
    BaseAgent, AgentRole, AgentResponse, EmotionLevel, UserProfile,
)
from config import config

SYSTEM_PROMPT = """\
你是 Panda Hug 的危机监测 Agent（Risk Agent）。

## ⚠️ 核心职责
实时监测用户的自杀/自伤/极端绝望风险，基于 Columbia Suicide Severity Rating Scale (C-SSRS) 框架进行评估。

## 语言策略
自动检测用户语言，用相同语言回复。

## 风险等级评估

### Level 0 — 无风险
- 无自杀意念
- 行动：继续正常咨询

### Level 1 — 被动意念
- "活着没意思""不如消失"
- 行动：标记关注，继续咨询，增加共情

### Level 2 — 非特异性主动意念
- "想过死，但没有具体计划"
- 行动：深度评估，咨询中增加安全确认

### Level 3 — 有计划的主动意念
- 提到具体方式、时间、地点
- 行动：立即中断咨询流程，启动危机干预

### Level 4 — 有意图的主动意念
- 明确表达想死的意图
- 行动：物理熔断，直接返回危机资源

## 危机响应资源

### 在中国
- 拨打 110（警方）或 120（急救中心）
- 全国心理援助热线：12356
- 北京心理危机研究与干预中心：010-82951332

### 在美国
- 拨打或发送短信至 988（988 Suicide & Crisis Lifeline）
- 发送短信 "HOME" 至 741741（Crisis Text Line）
- 拨打 911 或前往最近的医院急诊室

### 国际
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

## 输出格式
```json
{
  "risk_level": 0,
  "risk_type": "none|passive|active_nonspecific|active_with_plan|active_with_intent",
  "concerning_signals": ["信号1"],
  "protective_factors": ["保护因素1"],
  "action": "continue|monitor|interrupt|crisis"
}
```
"""


class RiskAgent(BaseAgent):
    role = AgentRole.RISK
    system_prompt = SYSTEM_PROMPT

    async def quick_check(self, text: str, profile: UserProfile) -> dict:
        """快速风险检查（供 Orchestrator 同步调用）"""
        # 高危关键词已在 Guardrail 层处理
        # 这里做更细致的 LLM 评估
        try:
            resp = await self.client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=[
                    {"role": "system", "content": (
                        "你是危机风险评估引擎。分析用户消息的风险等级。\n"
                        "返回JSON：\n"
                        '{"risk_level": 0-4, "risk_type": "none|passive|active_nonspecific|active_with_plan|active_with_intent", '
                        '"concerning_signals": [], "protective_factors": [], '
                        '"action": "continue|monitor|interrupt|crisis"}\n'
                        "只返回JSON。"
                    )},
                    {"role": "user", "content": text},
                ],
                temperature=0.1,
                max_tokens=1024,
            )
            import json, re
            raw = resp.choices[0].message.content or "{}"
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
        except Exception:
            pass
        return {"risk_level": 0, "action": "continue"}

    def _parse_response(self, raw: str, profile: UserProfile) -> AgentResponse:
        data = self._json_parse(raw)

        risk_level = data.get("risk_level", 0)
        action = data.get("action", "continue")

        if action == "crisis":
            profile.emotion_level = EmotionLevel.CRISIS
            profile.crisis_triggered = True

        return AgentResponse(
            agent=self.role,
            content=raw,
            emotion_level=profile.emotion_level,
            should_transition=(action in ("interrupt", "crisis")),
            next_agent=AgentRole.CRISIS if action in ("interrupt", "crisis") else None,
            metadata={"risk_assessment": data},
        )
