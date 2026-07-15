"""
知识库1：心理科普库（针对中美留学生）
"""

PSYCHOEDUCATION_DATA = {
    'china_in_us': [
        {
            'topic': '文化冲击',
            'content': '文化冲击是留学生最常见的心理挑战之一。它通常经历四个阶段：蜜月期、挫折期、适应期和融入期。了解这些阶段可以帮助你更好地应对。',
            'keywords': ['文化冲击', '适应', '蜜月期', '挫折期'],
        },
        {
            'topic': '学业压力',
            'content': '美国大学的学习方式与中国有很大不同。课堂讨论、小组作业和论文写作都需要不同的技能。给自己时间适应，不要期望一开始就完美。',
            'keywords': ['学业', '压力', 'GPA', '考试'],
        },
        {
            'topic': '孤独感',
            'content': '远离家乡和朋友，感到孤独是完全正常的。研究表明，大多数留学生在第一年都会经历强烈的孤独感。建立新的社交圈需要时间。',
            'keywords': ['孤独', '思乡', '朋友', '社交'],
        },
    ],
    'us_in_china': [
        {
            'topic': 'Culture Shock',
            'content': 'Culture shock is a common experience for international students in China. You may go through honeymoon, frustration, adjustment, and adaptation phases.',
            'keywords': ['culture shock', 'adjustment', 'honeymoon', 'frustration'],
        },
        {
            'topic': 'Language Barrier',
            'content': 'Learning Chinese is challenging but rewarding. Don\'t be afraid to make mistakes - most Chinese people appreciate foreigners trying to speak their language.',
            'keywords': ['language', 'Chinese', 'communication', 'barrier'],
        },
        {
            'topic': 'Social Norms',
            'content': 'Chinese social norms may be different from what you\'re used to. Concepts like "face" (面子) and group harmony (和谐) are important in Chinese culture.',
            'keywords': ['social norms', 'face', 'harmony', 'culture'],
        },
    ],
}


class PsychPsychoeducation:
    def __init__(self):
        self.data = PSYCHOEDUCATION_DATA

    def search(self, query, culture_tag=None):
        results = []
        cultures = [culture_tag] if culture_tag else self.data.keys()

        for culture in cultures:
            entries = self.data.get(culture, [])
            for entry in entries:
                # Simple keyword matching
                if any(kw in query.lower() for kw in entry['keywords']):
                    results.append({
                        'topic': entry['topic'],
                        'content': entry['content'],
                        'culture': culture,
                    })

        return results

    def get_all(self, culture_tag=None):
        if culture_tag:
            return self.data.get(culture_tag, [])
        all_entries = []
        for entries in self.data.values():
            all_entries.extend(entries)
        return all_entries
