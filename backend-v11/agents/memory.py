"""
Memory Agent - 记忆管理员
存储用户历史数据、生成动态变化总结
"""

from datetime import datetime


class MemoryAgent:
    def __init__(self):
        self.user_memories = {}

    def init_user(self, user_id):
        """初始化用户记忆"""
        self.user_memories[user_id] = {
            'conversations': [],
            'emotions': [],
            'trainings': [],
            'reports': [],
            'created_at': datetime.now().isoformat(),
        }

    def save_conversation(self, user_id, conversation):
        """保存对话记录"""
        if user_id not in self.user_memories:
            self.init_user(user_id)

        conversation['timestamp'] = datetime.now().isoformat()
        self.user_memories[user_id]['conversations'].append(conversation)

    def save_emotion(self, user_id, emotion_record):
        """保存情绪记录"""
        if user_id not in self.user_memories:
            self.init_user(user_id)

        self.user_memories[user_id]['emotions'].append(emotion_record)

    def save_training(self, user_id, training_record):
        """保存训练记录"""
        if user_id not in self.user_memories:
            self.init_user(user_id)

        self.user_memories[user_id]['trainings'].append(training_record)

    def save_report(self, user_id, report):
        """保存报告"""
        if user_id not in self.user_memories:
            self.init_user(user_id)

        self.user_memories[user_id]['reports'].append(report)

    def get_history(self, user_id):
        """获取用户完整历史"""
        if user_id not in self.user_memories:
            self.init_user(user_id)

        return self.user_memories[user_id]

    def get_recent_emotions(self, user_id, days=7):
        """获取最近N天的情绪记录"""
        if user_id not in self.user_memories:
            return []

        emotions = self.user_memories[user_id]['emotions']
        return emotions[-days:] if len(emotions) >= days else emotions

    def get_emotion_trend(self, user_id):
        """获取情绪变化趋势"""
        if user_id not in self.user_memories:
            return []

        emotions = self.user_memories[user_id]['emotions']
        trend = []
        for e in emotions:
            trend.append({
                'timestamp': e.get('timestamp'),
                'bear_mood': e.get('bear_mood'),
                'risk_level': e.get('risk_level'),
            })
        return trend

    def generate_summary(self, user_id):
        """生成用户记忆摘要"""
        if user_id not in self.user_memories:
            return None

        memory = self.user_memories[user_id]
        total_conversations = len(memory['conversations'])
        total_emotions = len(memory['emotions'])
        total_trainings = len(memory['trainings'])

        # Get dominant emotions
        emotion_counts = {}
        for e in memory['emotions']:
            mood = e.get('bear_mood', 'unknown')
            emotion_counts[mood] = emotion_counts.get(mood, 0) + 1

        dominant_mood = max(emotion_counts, key=emotion_counts.get) if emotion_counts else 'unknown'

        return {
            'total_conversations': total_conversations,
            'total_emotions': total_emotions,
            'total_trainings': total_trainings,
            'dominant_mood': dominant_mood,
            'created_at': memory['created_at'],
        }
