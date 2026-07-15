"""
知识库8：医疗资源推荐库
"""
MEDICAL_RESOURCES = {
    'china_in_us': [
        {'name': '学校心理咨询中心', 'desc': '大多数美国大学提供免费心理咨询服务', 'how': '联系Student Health Center'},
        {'name': 'Psychology Today', 'desc': '查找附近的心理咨询师', 'how': '访问psychologytoday.com'},
        {'name': 'SAMHSA', 'desc': '药物滥用和心理健康服务管理局', 'how': '拨打1-800-662-4357'},
    ],
    'us_in_china': [
        {'name': '医院心理科', 'desc': '三甲医院通常设有心理科或精神科', 'how': '直接挂号就诊'},
        {'name': '简单心理', 'desc': '在线心理咨询平台', 'how': '下载简单心理APP'},
        {'name': '好心情', 'desc': '互联网心理健康平台', 'how': '访问haoxinqing.com'},
    ],
}

class MedicalResources:
    def __init__(self):
        self.data = MEDICAL_RESOURCES
    def search(self, query, culture_tag=None):
        cultures = [culture_tag] if culture_tag else self.data.keys()
        results = []
        for c in cultures:
            results.extend(self.data.get(c, []))
        return results
