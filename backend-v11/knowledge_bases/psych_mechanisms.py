"""
知识库3：心理机制库
"""
MECHANISMS = [
    {'name': '认知失调', 'desc': '当行为与信念不一致时产生的心理不适', 'keywords': ['矛盾', '纠结', '不一致']},
    {'name': '习得性无助', 'desc': '反复失败后认为自己无法改变结果', 'keywords': ['无助', '放弃', '没用']},
    {'name': '文化适应压力', 'desc': '在新文化环境中因价值观冲突产生的压力', 'keywords': ['文化', '适应', '冲突']},
    {'name': '社交焦虑', 'desc': '在社交场合中感到紧张和不安', 'keywords': ['社交', '紧张', '害怕']},
    {'name': '分离焦虑', 'desc': '与亲近的人分离时产生的不安感', 'keywords': ['分离', '想念', '家']},
]

class PsychMechanisms:
    def __init__(self):
        self.data = MECHANISMS
    def search(self, query, culture_tag=None):
        return [m for m in self.data if any(kw in query for kw in m['keywords'])]
