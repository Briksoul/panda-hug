"""
知识库7：干预技巧库
"""
INTERVENTIONS = {
    'anxious': [
        {'name': '4-7-8呼吸法', 'desc': '吸气4秒，屏息7秒，呼气8秒', 'type': 'immediate'},
        {'name': '接地练习', 'desc': '说出5个看到的、4个触摸到的、3个听到的', 'type': 'immediate'},
        {'name': '认知重构', 'desc': '识别并挑战不合理的担忧', 'type': 'long_term'},
    ],
    'sad': [
        {'name': '感恩日记', 'desc': '每天写下3件感恩的事', 'type': 'long_term'},
        {'name': '行为激活', 'desc': '安排愉快的活动', 'type': 'long_term'},
        {'name': '社交连接', 'desc': '联系一位朋友或家人', 'type': 'immediate'},
    ],
    'tired': [
        {'name': '正念冥想', 'desc': '关注当下，不评判', 'type': 'immediate'},
        {'name': '渐进式肌肉放松', 'desc': '从脚到头逐步放松肌肉', 'type': 'immediate'},
        {'name': '睡眠卫生', 'desc': '建立规律的睡眠习惯', 'type': 'long_term'},
    ],
}

class InterventionTips:
    def __init__(self):
        self.data = INTERVENTIONS
    def search(self, query, culture_tag=None):
        results = []
        for emotion, tips in self.data.items():
            if emotion in query:
                results.extend(tips)
        return results if results else self.data.get('anxious', [])
