"""
知识库2：心理咨询技术库（分成中/美）
"""

TECHNIQUES_DATA = {
    'china_in_us': [
        {
            'technique': '共情式倾听',
            'desc': '先理解对方的感受，再给予回应。使用"我能感受到..."、"听起来..."等表达。',
            'when': '当用户表达情绪时',
        },
        {
            'technique': '间接引导',
            'desc': '通过提问帮助用户自己发现答案，而不是直接给出建议。',
            'when': '当用户面临选择时',
        },
    ],
    'us_in_china': [
        {
            'technique': 'Active Listening',
            'desc': 'Show understanding through reflection and validation. Use "It sounds like..." or "I hear you..."',
            'when': 'When user expresses emotions',
        },
        {
            'technique': 'Open-ended Questions',
            'desc': 'Encourage exploration with questions like "How did that make you feel?" or "What was that like for you?"',
            'when': 'When exploring user experiences',
        },
    ],
}


class PsychTechniques:
    def __init__(self):
        self.data = TECHNIQUES_DATA

    def search(self, query, culture_tag=None):
        results = []
        cultures = [culture_tag] if culture_tag else self.data.keys()
        for culture in cultures:
            entries = self.data.get(culture, [])
            for entry in entries:
                results.append({
                    'technique': entry['technique'],
                    'desc': entry['desc'],
                    'culture': culture,
                })
        return results
