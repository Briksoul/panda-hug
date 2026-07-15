"""
知识库5：文化特征库
"""
CULTURE_DATA = {
    'china_in_us': {
        'traits': ['集体主义', '重视家庭', '面子文化', '含蓄表达'],
        'adaptation_stages': ['蜜月期', '挫折期', '适应期', '融入期'],
        'common_challenges': ['语言障碍', '社交困难', '学业压力', '身份认同'],
    },
    'us_in_china': {
        'traits': ['Individualism', 'Direct communication', 'Independence', 'Equality'],
        'adaptation_stages': ['Honeymoon', 'Frustration', 'Adjustment', 'Adaptation'],
        'common_challenges': ['Language barrier', 'Social norms', 'Food adjustment', 'Privacy concerns'],
    },
}

class CultureTraits:
    def __init__(self):
        self.data = CULTURE_DATA
    def search(self, query, culture_tag=None):
        if culture_tag and culture_tag in self.data:
            return [self.data[culture_tag]]
        return list(self.data.values())
