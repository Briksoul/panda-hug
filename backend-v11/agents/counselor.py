"""
Counselor Agent - 前台
建立咨询关系、进行对话、情绪与事件探索
根据用户文化身份分别给予适合的引导技巧
接入 DeepSeek LLM 生成真实对话
"""

from services.llm import chat, multi_turn

SYSTEM_PROMPT = """你是 Panda Hug 的心理咨询师，一只温暖、专业的大熊猫形象。
你的职责：
1. 建立信任关系，让用户感到被理解和接纳
2. 通过开放式问题探索用户的情绪和经历
3. 根据用户的文化背景调整沟通风格
4. 识别危机信号并提供适当回应

沟通原则：
- 先共情，再引导
- 不评判，不给建议（除非危机情况）
- 用简短、温暖的语言回复
- 每次回复控制在2-3句话，不要长篇大论
- 适当使用 emoji 增加亲和力

文化适配：
- china_in_us：理解留学生在异国的压力，委婉温和
- us_in_china：理解外国人在中国的文化冲击，直接开放
- other：温和而直接"""

CRISIS_PROMPT = """用户可能处于心理危机状态。请：
1. 表达关心和担忧
2. 提供当地心理援助热线
3. 鼓励用户联系信任的人
4. 不要试图独自解决问题

中国热线：400-161-9995（24小时）
美国热线：988（Suicide & Crisis Lifeline）
"""


class CounselorAgent:
    def __init__(self):
        self.conversation_history = {}  # user_id -> [messages]

    def respond(self, message, culture_tag, sensing_result):
        """生成咨询风格的回复（LLM 驱动）"""
        risk_level = sensing_result.get('risk_level', 0)

        if risk_level >= 2:
            return self._crisis_response(message, culture_tag)

        # Build culture context
        culture_context = {
            'china_in_us': '用户是在美国的中国留学生，用中文回复，理解跨文化压力。',
            'us_in_china': 'User is an American in China. Reply in English, be direct and warm.',
            'other': '用中文回复，温和而直接。',
        }

        system = f"{SYSTEM_PROMPT}\n\n文化背景：{culture_context.get(culture_tag, culture_context['other'])}"

        # Add sensing context
        emotion = sensing_result.get('dominant_emotion', 'neutral')
        event = sensing_result.get('detected_event')
        context_parts = [f"用户当前情绪：{emotion}"]
        if event:
            context_parts.append(f"可能涉及的事件：{event}")
        context_info = " | ".join(context_parts)

        user_prompt = f"[系统分析] {context_info}\n\n用户说：{message}"

        try:
            return chat(system, user_prompt, temperature=0.8)
        except Exception as e:
            # Fallback to simple response
            return self._fallback(message, culture_tag)

    def _crisis_response(self, message, culture_tag):
        """危机情况的回复"""
        system = f"{SYSTEM_PROMPT}\n\n{CRISIS_PROMPT}"
        try:
            return chat(system, f"用户说：{message}", temperature=0.5)
        except Exception:
            if culture_tag == 'china_in_us':
                return (
                    "我很担心你现在的状态。你的安全是最重要的。\n\n"
                    "如果你现在有伤害自己的想法，请立即拨打：\n"
                    "🇺🇸 美国自杀预防热线：988\n"
                    "📱 Crisis Text Line：发短信 HOME 到 741741\n\n"
                    "你不是一个人。我在这里陪你。"
                )
            elif culture_tag == 'us_in_china':
                return (
                    "I'm really concerned about your safety right now. "
                    "If you're having thoughts of harming yourself, please reach out:\n\n"
                    "🇨🇳 24小时心理援助热线：400-161-9995\n"
                    "🏥 Beijing Crisis Line: 010-82951332\n\n"
                    "You're not alone. I'm here with you."
                )
            return (
                "我很担心你现在的状态。请记住，你不是一个人。\n\n"
                "如果你需要帮助，请拨打当地的心理援助热线。\n"
                "你的安全是最重要的。"
            )

    def _fallback(self, message, culture_tag):
        """LLM 调用失败时的降级回复"""
        if culture_tag == 'us_in_china':
            return "I hear you. Tell me more about how you're feeling. I'm here to listen."
        return "谢谢你愿意和我分享。能告诉我更多吗？我在这里听你说。"
