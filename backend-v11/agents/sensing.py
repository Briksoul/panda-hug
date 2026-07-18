"""
Sensing Agent - 分析员
监测文本、语音、视频的情绪数据
计算焦虑/抑郁指数、干预效果评估
接入 DeepSeek LLM 做更精准的情绪分析
"""

import json
from services.llm import chat_json

SYSTEM_PROMPT = """你是一个情绪分析专家。分析用户输入，返回严格的 JSON 格式。

输出格式：
{
  "dominant_emotion": "sad|anxious|angry|happy|calm|tired|neutral",
  "emotion_scores": {"sad": 0, "anxious": 0, "angry": 0, "happy": 0, "calm": 0, "tired": 0},
  "risk_level": 0,
  "crisis_detected": false,
  "detected_event": "描述用户提到的核心事件，没有则null",
  "reasoning": "简短分析理由"
}

risk_level 说明：
- 0: 安全，无明显负面情绪
- 1: 轻度困扰，需要关注
- 2: 高风险，需要干预（出现自伤/自杀意念、极端绝望等）

emotion_scores 中每个值 0-3，表示该情绪的强度。

只输出 JSON，不要其他文字。"""

# Fallback keyword detection
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


class SensingAgent:
    def __init__(self):
        self.emotion_scores = {}

    def analyze(self, message, mode='text'):
        """分析用户输入的情绪数据（LLM + 关键词双保险）"""
        # Try LLM analysis first
        try:
            result = chat_json(SYSTEM_PROMPT, f"用户输入：{message}")
            # Ensure all required fields
            result.setdefault('mode', mode)
            result.setdefault('dominant_emotion', 'neutral')
            result.setdefault('emotion_scores', {})
            result.setdefault('risk_level', 0)
            result.setdefault('crisis_detected', False)
            result.setdefault('detected_event', None)
            result.setdefault('keywords_found', [])
            return result
        except Exception:
            # Fallback to keyword-based analysis
            return self._keyword_analyze(message, mode)

    def _keyword_analyze(self, message, mode='text'):
        """关键词兜底分析"""
        result = {
            'mode': mode,
            'dominant_emotion': 'neutral',
            'emotion_scores': {},
            'risk_level': 0,
            'crisis_detected': False,
            'detected_event': None,
            'keywords_found': [],
        }

        emotion_counts = {}
        for emotion, keywords in EMOTION_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in message.lower())
            if count > 0:
                emotion_counts[emotion] = count
                result['keywords_found'].extend([kw for kw in keywords if kw in message.lower()])

        if emotion_counts:
            result['dominant_emotion'] = max(emotion_counts, key=emotion_counts.get)
            result['emotion_scores'] = emotion_counts

        crisis_found = [kw for kw in CRISIS_KEYWORDS if kw in message.lower()]
        if crisis_found:
            result['crisis_detected'] = True
            result['risk_level'] = 2
            result['keywords_found'].extend(crisis_found)
        elif result['dominant_emotion'] in ['sad', 'anxious']:
            result['risk_level'] = 1

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
