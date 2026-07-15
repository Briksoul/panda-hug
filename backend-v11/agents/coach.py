"""
Coach Agent - 教练
引导放松训练（呼吸、正念等）
记录训练类型、时长、完成率
"""


TRAINING_TYPES = [
    {
        'id': 'breathing_478',
        'name': '4-7-8 呼吸法',
        'desc': '通过调节呼吸节奏，快速平静身心',
        'duration': 180,
        'category': 'breathing',
    },
    {
        'id': 'breathing_box',
        'name': '方块呼吸',
        'desc': '军人使用的高效减压呼吸技术',
        'duration': 120,
        'category': 'breathing',
    },
    {
        'id': 'mindfulness',
        'name': '正念冥想',
        'desc': '关注当下，减少焦虑和压力',
        'duration': 300,
        'category': 'meditation',
    },
    {
        'id': 'nature',
        'name': '自然冥想',
        'desc': '想象自己在大自然中，找回内心的宁静',
        'duration': 240,
        'category': 'meditation',
    },
]


class CoachAgent:
    def __init__(self):
        self.training_records = {}

    def get_training_types(self):
        """获取所有训练类型"""
        return TRAINING_TYPES

    def recommend_training(self, emotion_state, risk_level):
        """根据情绪状态推荐训练"""
        if risk_level >= 2:
            return TRAINING_TYPES[0]  # 4-7-8 breathing for high risk

        if emotion_state in ['anxious', 'stressed']:
            return TRAINING_TYPES[1]  # Box breathing

        if emotion_state in ['sad', 'tired']:
            return TRAINING_TYPES[2]  # Mindfulness

        return TRAINING_TYPES[3]  # Nature meditation

    def record_training(self, user_id, training_type, duration, completed):
        """记录训练完成情况"""
        if user_id not in self.training_records:
            self.training_records[user_id] = []

        record = {
            'type': training_type,
            'duration': duration,
            'completed': completed,
            'completion_rate': 100 if completed else 0,
            'timestamp': None,  # Will be set by caller
        }
        self.training_records[user_id].append(record)
        return record

    def get_training_stats(self, user_id):
        """获取训练统计"""
        records = self.training_records.get(user_id, [])
        if not records:
            return {
                'total_sessions': 0,
                'total_duration': 0,
                'avg_completion': 0,
                'favorite_type': None,
            }

        total = len(records)
        total_duration = sum(r['duration'] for r in records)
        avg_completion = sum(r['completion_rate'] for r in records) / total

        # Find favorite type
        type_counts = {}
        for r in records:
            t = r['type']
            type_counts[t] = type_counts.get(t, 0) + 1
        favorite = max(type_counts, key=type_counts.get) if type_counts else None

        return {
            'total_sessions': total,
            'total_duration': total_duration,
            'avg_completion': avg_completion,
            'favorite_type': favorite,
        }
