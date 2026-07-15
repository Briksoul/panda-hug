"""
知识库6：案例事件库
"""
CASES = {
    'china_in_us': [
        {'event': '期中考试成绩不理想', 'response': '很多中国留学生在第一学期都会经历成绩波动。美国的评分方式和学习方法与中国不同，给自己时间适应。', 'keywords': ['考试', '成绩', 'GPA']},
        {'event': '与室友发生文化冲突', 'response': '文化差异导致的生活习惯冲突很常见。尝试开放沟通，表达你的需求，同时也理解对方的立场。', 'keywords': ['室友', '冲突', '文化']},
    ],
    'us_in_china': [
        {'event': 'Language barrier in daily life', 'response': 'Many Americans in China face language challenges. Try using translation apps and don\'t be afraid to use gestures.', 'keywords': ['language', 'communication', 'daily']},
        {'event': 'Feeling isolated during Chinese holidays', 'response': 'Chinese holidays like Spring Festival can make foreign students feel left out. Try joining local celebrations!', 'keywords': ['holiday', 'isolated', 'festival']},
    ],
}

class CaseEvents:
    def __init__(self):
        self.data = CASES
    def search(self, query, culture_tag=None):
        cultures = [culture_tag] if culture_tag else self.data.keys()
        results = []
        for c in cultures:
            for case in self.data.get(c, []):
                if any(kw in query for kw in case['keywords']):
                    results.append(case)
        return results
