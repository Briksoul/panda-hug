"""
Counselor Agent - 前台
建立咨询关系、进行对话、情绪与事件探索
根据用户文化身份分别给予适合的引导技巧
"""

import random

# Response templates based on culture and situation
CHINA_IN_US_RESPONSES = [
    "我能感受到你在异国他乡的不容易。能和我多说一些吗？",
    "听起来这段时间确实很辛苦。你有没有想过，是什么让你一直坚持下来？",
    "你的感受都是可以理解的。很多在美国的中国学生都有类似的经历。",
    "有时候，把心里的话说出来本身就是一种释放。我在这里听你说。",
    "你已经做得很好了。适应新环境需要时间，不要对自己太苛刻。",
]

US_IN_CHINA_RESPONSES = [
    "That sounds really challenging. Tell me more about how you're feeling.",
    "It's completely normal to feel this way when adjusting to a new culture.",
    "I hear you. What do you think would help you feel better right now?",
    "You're being really brave by sharing this. What's been the hardest part?",
    "Many international students go through this. You're not alone in feeling this way.",
]

GENERAL_RESPONSES = [
    "谢谢你愿意和我分享。能告诉我更多吗？",
    "我理解你的感受。这种情况持续多久了？",
    "你觉得最困扰你的是什么？",
    "在这些困难中，你觉得自己学到了什么？",
    "你的感受很重要。我们可以慢慢聊。",
]

FOLLOW_UP_QUESTIONS = [
    "这件事是什么时候开始的？",
    "当时你的第一反应是什么？",
    "你觉得这件事对你的日常生活有什么影响？",
    "有没有什么让你感到稍微好一点的事情？",
    "你身边有可以倾诉的人吗？",
]


class CounselorAgent:
    def __init__(self):
        self.conversation_history = {}

    def respond(self, message, culture_tag, sensing_result):
        """生成咨询风格的回复"""
        # Get culture-specific responses
        if culture_tag == 'china_in_us':
            templates = CHINA_IN_US_RESPONSES
        elif culture_tag == 'us_in_china':
            templates = US_IN_CHINA_RESPONSES
        else:
            templates = GENERAL_RESPONSES

        # Adjust based on sensing result
        risk_level = sensing_result.get('risk_level', 0)
        dominant_emotion = sensing_result.get('dominant_emotion', 'neutral')

        if risk_level >= 2:
            return self._crisis_response(culture_tag)

        if dominant_emotion in ['sad', 'anxious']:
            response = random.choice(templates)
            follow_up = random.choice(FOLLOW_UP_QUESTIONS)
            return f"{response}\n\n{follow_up}"

        if dominant_emotion in ['happy', 'calm']:
            positive_responses = [
                "很高兴听到你状态不错！最近有什么开心的事吗？",
                "能感受到你的积极能量！继续保持！",
                "听起来你最近过得挺好的，真为你高兴。",
            ]
            return random.choice(positive_responses)

        return random.choice(templates) + "\n\n" + random.choice(FOLLOW_UP_QUESTIONS)

    def _crisis_response(self, culture_tag):
        """危机情况的回复"""
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
