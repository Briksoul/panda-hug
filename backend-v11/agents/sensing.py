"""
Sensing Agent - 分析员
监测文本、语音、视频的情绪数据
计算焦虑/抑郁指数、干预效果评估
识别自伤、自杀、危机词汇，触发紧急干预模式
"""

import re

# Emotion keywords for detection
EMOTION_KEYWORDS = {
    'sad': ['难过', '伤心', '沮丧', '失落', '哭', '悲伤', 'sad', 'depressed', 'down', 'lonely', 'miss'],
    'anxious': ['焦虑', '紧张', '担心', '不安', '烦躁', 'anxious', 'worried', 'nervous', 'stressed', 'panic'],
    'angry': ['生气', '愤怒', '烦', '讨厌', '恨', 'angry', 'mad', 'furious', 'hate', 'frustrated'],
    'happy': ['开心', '高兴', '快乐', '幸福', '棒', '好', 'happy', 'glad', 'great', 'wonderful', 'excited'],
    'calm': ['平静', '放松', '安心', '舒服', 'calm', 'relaxed', 'peaceful', 'comfortable'],
    'tired': ['累', '疲惫', '困', '没力气', '倦', 'tired', 'exhausted', 'drained', 'fatigue'],
}

CRISIS_KEYWORDS = [
    '自杀', '不想活', '结束生命', '跳楼', '割腕', '死',
    'suicide', 'kill myself', 'end it all', 'self-harm', 'cut myself',
    '不想存在', '活着没意思', '没有意义',
]

CRISIS_RESPONSE_MAP = {
    0: 'safe',      # No crisis detected
    1: 'monitor',   # Mild concern
    2: 'alert',     # High concern - trigger intervention
}


class SensingAgent:
    def __init__(self):
        self.emotion_scores = {}

    def analyze(self, message, mode='text'):
        """分析用户输入的情绪数据"""
        result = {
            'mode': mode,
            'dominant_emotion': 'neutral',
            'emotion_scores': {},
            'risk_level': 0,
            'crisis_detected': False,
            'detected_event': None,
            'keywords_found': [],
        }

        # Analyze text emotions
        emotion_counts = {}
        for emotion, keywords in EMOTION_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in message.lower())
            if count > 0:
                emotion_counts[emotion] = count
                result['keywords_found'].extend([kw for kw in keywords if kw in message.lower()])

        if emotion_counts:
            result['dominant_emotion'] = max(emotion_counts, key=emotion_counts.get)
            result['emotion_scores'] = emotion_counts

        # Crisis detection
        crisis_found = [kw for kw in CRISIS_KEYWORDS if kw in message.lower()]
        if crisis_found:
            result['crisis_detected'] = True
            result['risk_level'] = 2
            result['keywords_found'].extend(crisis_found)
        elif result['dominant_emotion'] in ['sad', 'anxious']:
            result['risk_level'] = 1

        # Event detection (simple pattern matching)
        event_patterns = [
            r'考试|exam|test|grade',
            r'和.{0,5}吵架|fight|argument|conflict',
            r'分手|break.?up|relationship',
            r'家|home|family|parent',
            r'工作|job|work|intern',
            r'钱|money|tuition|rent',
        ]
        for pattern in event_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                result['detected_event'] = re.search(pattern, message, re.IGNORECASE).group()
                break

        return result

    def analyze_voice(self, audio_data):
        """分析语音情绪（占位，需要接入语音分析API）"""
        return {
            'tone': 'neutral',
            'energy': 0.5,
            'speech_rate': 'normal',
        }

    def analyze_video(self, frame_data):
        """分析面部表情（占位，需要接入面部识别API）"""
        return {
            'expression': 'neutral',
            'confidence': 0.5,
        }
