"""
Insight Report Agent - 报告员
提取核心事件、行为模式、心理机制链
构建用户心理模型，整合分析结果，生成心理报告
接入 DeepSeek LLM 生成个性化报告
"""

from datetime import datetime
from services.llm import chat


REPORT_SYSTEM_PROMPT = """你是一位专业的心理报告撰写专家。根据用户的历史对话和情绪数据，生成一份温暖、专业的心理洞察报告。

报告要求：
- 语言温暖、有同理心，避免冷冰冰的医学术语
- 基于实际数据，不编造信息
- 给出具体可行的建议
- 以熊猫的口吻写「熊猫寄语」模块

输出格式为 JSON，包含以下 7 个模块：
{
  "bear_mood": "happy|calm|tired",
  "emotion_index": 0-100,
  "event_timeline": [{"time": "...", "event": "...", "emotion": "..."}],
  "mechanism_analysis": "心理机制分析文字",
  "culture_stage": {"stage": "阶段名", "desc": "阶段描述"},
  "needs": ["需求1", "需求2", "需求3"],
  "interventions": {"long": ["长期建议1", "..."], "immediate": ["即时建议1", "..."]},
  "panda_message": "熊猫寄语"
}

只输出 JSON。"""


class InsightReportAgent:
    def __init__(self):
        pass

    def generate(self, user, history, emotions):
        """生成心理情绪洞察报告（7个模块，LLM 驱动）"""
        culture_tag = user.get('culture_tag', 'other')
        user_name = user.get('name', '朋友')

        latest_emotion = emotions[-1] if emotions else {}
        bear_mood = latest_emotion.get('bear_mood', 'calm')
        risk_level = latest_emotion.get('risk_level', 0)

        # Build context for LLM
        context = self._build_context(user_name, culture_tag, history, emotions)

        try:
            import json
            from services.llm import chat as llm_chat
            raw = llm_chat(REPORT_SYSTEM_PROMPT, context, temperature=0.5, max_tokens=2000)
            # Parse JSON
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()
            report = json.loads(raw)
            # Ensure all fields
            report.setdefault('bear_mood', bear_mood)
            report.setdefault('emotion_index', max(100 - risk_level * 30, 30))
            report.setdefault('panda_message', f"{user_name}，我会一直在这里陪伴你。🌈")
            return report
        except Exception:
            # Fallback to template
            return self._template_report(user_name, culture_tag, bear_mood, risk_level, history, emotions)

    def _build_context(self, user_name, culture_tag, history, emotions):
        """构建给 LLM 的上下文"""
        parts = [f"用户名：{user_name}", f"文化背景：{culture_tag}"]

        if emotions:
            parts.append("情绪记录：")
            for e in emotions[-5:]:
                parts.append(f"  - {e.get('emotion', '未知')} | PHQ-2:{e.get('phq2_total', 0)} | GAD-2:{e.get('gad2_total', 0)} | 小熊状态:{e.get('bear_mood', '未知')}")

        conversations = history.get('conversations', [])
        if conversations:
            parts.append("最近对话：")
            for c in conversations[-5:]:
                parts.append(f"  - 用户：{c.get('user_message', '')[:80]}")
                parts.append(f"    小熊：{c.get('panda_response', '')[:80]}")

        return "\n".join(parts)

    def _template_report(self, user_name, culture_tag, bear_mood, risk_level, history, emotions):
        """LLM 失败时的模板报告"""
        event_timeline = self._build_timeline(history)
        mechanism = self._analyze_mechanism(culture_tag, event_timeline)
        culture_stage = self._assess_culture_stage(culture_tag, history)
        needs = self._extract_needs(history)
        interventions = self._generate_interventions(risk_level, culture_tag)
        panda_message = self._generate_panda_message(user_name, bear_mood, culture_tag)

        return {
            'bear_mood': bear_mood,
            'emotion_index': max(100 - risk_level * 30, 30),
            'event_timeline': event_timeline,
            'mechanism_analysis': mechanism,
            'culture_stage': culture_stage,
            'needs': needs,
            'interventions': interventions,
            'panda_message': panda_message,
        }

    def _build_timeline(self, history):
        if not history:
            return [{'time': '最近', 'event': '刚开始使用 Panda Hug', 'emotion': '期待'}]
        timeline = []
        conversations = history.get('conversations', [])
        for conv in conversations[-5:]:
            sensing = conv.get('sensing', {})
            timeline.append({
                'time': conv.get('timestamp', '未知'),
                'event': conv.get('user_message', '')[:50],
                'emotion': sensing.get('dominant_emotion', 'neutral'),
            })
        return timeline if timeline else [{'time': '最近', 'event': '开始了第一次对话', 'emotion': '好奇'}]

    def _analyze_mechanism(self, culture_tag, timeline):
        if culture_tag == 'china_in_us':
            return "作为在美求学的中国学生，您可能正在经历文化适应的挑战。学业压力、语言障碍和文化差异可能导致情绪波动。这些都是正常的跨文化适应过程。"
        elif culture_tag == 'us_in_china':
            return "As an American student in China, you may be experiencing culture shock. Language barriers, different social norms, and being far from home can all contribute to emotional challenges."
        return "您正在经历的情绪变化是正常的。让我们一起探索背后的原因。"

    def _assess_culture_stage(self, culture_tag, history):
        stages = {
            'china_in_us': {'stage': '挫折期', 'desc': '开始感受到文化差异带来的实际困难，情绪波动较大。'},
            'us_in_china': {'stage': 'Frustration Stage', 'desc': 'Starting to feel the real challenges of cultural differences.'},
            'other': {'stage': '适应期', 'desc': '正在逐步适应新环境。'},
        }
        return stages.get(culture_tag, stages['other'])

    def _extract_needs(self, history):
        return ['归属感 — 渴望被理解和接纳', '情感支持 — 需要来自家人和朋友的鼓励', '自我效能 — 需要小的成功体验来重建信心']

    def _generate_interventions(self, risk_level, culture_tag):
        long_term = ['每周进行2-3次正念冥想练习', '尝试加入校园社团，建立本地社交圈', '定期与家人视频通话，保持情感连接']
        immediate = ['尝试4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒', '写下三件今天让你感到感恩的事', '去户外散步15分钟，接触自然']
        if risk_level >= 2:
            long_term.insert(0, '建议寻求专业心理咨询师的帮助')
            immediate.insert(0, '请立即联系信任的人，不要独自承受')
        return {'long': long_term, 'immediate': immediate}

    def _generate_panda_message(self, name, bear_mood, culture_tag):
        if bear_mood == 'happy':
            return f"{name}，看到你状态这么好真开心！继续保持这份积极的心态，你很棒！🌈"
        elif bear_mood == 'calm':
            return f"{name}，你一直都在努力适应新的环境，这本身就很了不起。每一次困难都是成长的机会，而我会一直在这里陪伴你。🌈"
        else:
            return f"{name}，我能感受到你现在很辛苦。请记住，这些感受都是暂时的。你不是一个人在面对这些。💙"
