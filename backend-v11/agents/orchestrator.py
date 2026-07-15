"""
Cognitive Orchestrator - 大脑
负责调度全局、控制对话进度、切换阶段、整合多方信息
识别用户文化身份、判断文化适应阶段、调用对应文化知识库
"""


class CognitiveOrchestrator:
    def __init__(self):
        self.user_states = {}

    def get_user_state(self, user_id):
        if user_id not in self.user_states:
            self.user_states[user_id] = {
                'phase': 'emotion',  # emotion | chat | report | training
                'culture_tag': 'other',
                'collected_info': {
                    'core_event': None,
                    'core_emotion': None,
                    'culture_stage': None,
                },
                'turn_count': 0,
            }
        return self.user_states[user_id]

    def decide_flow(self, user_id, message, sensing_result):
        """根据用户输入和情绪分析决定下一步流程"""
        state = self.get_user_state(user_id)
        state['turn_count'] += 1

        # Update collected info from sensing
        if sensing_result.get('detected_event'):
            state['collected_info']['core_event'] = sensing_result['detected_event']
        if sensing_result.get('dominant_emotion'):
            state['collected_info']['core_emotion'] = sensing_result['dominant_emotion']

        # Check if we have enough info to generate report
        has_event = state['collected_info']['core_event'] is not None
        has_emotion = state['collected_info']['core_emotion'] is not None
        enough_turns = state['turn_count'] >= 3

        if has_event and has_emotion and enough_turns:
            return {
                'action': 'suggest_report',
                'message': '你的每一次分享我都会记在心里，并为你生成专属的心理情绪洞察报告。',
                'collected_info': state['collected_info'],
            }

        # Check for crisis keywords
        crisis_keywords = ['自杀', '不想活', '结束生命', 'suicide', 'kill myself', 'end it all']
        if any(kw in message.lower() for kw in crisis_keywords):
            return {
                'action': 'crisis_intervention',
                'message': '我很担心你现在的状态。你的安全是最重要的。',
            }

        return {
            'action': 'continue_chat',
            'turn_count': state['turn_count'],
        }

    def adapt_style(self, culture_tag):
        """根据文化身份调整沟通风格"""
        styles = {
            'china_in_us': {
                'style': 'indirect',
                'tone': '委婉、温和、注重情感共鸣',
                'approach': '先共情，再引导，避免直接挑战',
            },
            'us_in_china': {
                'style': 'direct',
                'tone': '直接、开放、鼓励表达',
                'approach': '直接询问感受，鼓励开放讨论',
            },
            'other': {
                'style': 'balanced',
                'tone': '温和而直接',
                'approach': '根据对话内容灵活调整',
            },
        }
        return styles.get(culture_tag, styles['other'])
