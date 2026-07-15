"""
知识库4：危机转介库
"""
CRISIS_RESOURCES = {
    'china_in_us': [
        {'name': '988 Suicide & Crisis Lifeline', 'phone': '988', 'desc': '24/7免费危机热线'},
        {'name': 'Crisis Text Line', 'text': 'HOME to 741741', 'desc': '短信危机支持'},
        {'name': 'Campus Counseling', 'desc': '学校心理咨询中心', 'note': '请联系学校获取具体信息'},
    ],
    'us_in_china': [
        {'name': '北京心理危机研究与干预中心', 'phone': '010-82951332', 'desc': '24小时心理援助'},
        {'name': '全国心理援助热线', 'phone': '400-161-9995', 'desc': '24小时免费咨询'},
        {'name': '希望24热线', 'phone': '400-161-9995', 'desc': '生命热线'},
    ],
}

class CrisisReferral:
    def __init__(self):
        self.data = CRISIS_RESOURCES
    def search(self, query, culture_tag=None):
        cultures = [culture_tag] if culture_tag else self.data.keys()
        results = []
        for c in cultures:
            results.extend(self.data.get(c, []))
        return results
