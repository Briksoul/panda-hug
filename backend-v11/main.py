"""
Panda Hug V11 - Flask Backend
6 Agents + 8 Knowledge Bases + User System
"""
import os
import json
import time
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from agents.orchestrator import CognitiveOrchestrator
from agents.counselor import CounselorAgent
from agents.sensing import SensingAgent
from agents.insight_report import InsightReportAgent
from agents.coach import CoachAgent
from agents.memory import MemoryAgent
from knowledge_bases.manager import KnowledgeBaseManager

app = Flask(__name__)
CORS(app)

# Initialize agents
orchestrator = CognitiveOrchestrator()
counselor = CounselorAgent()
sensing = SensingAgent()
insight_report = InsightReportAgent()
coach = CoachAgent()
memory = MemoryAgent()
kb_manager = KnowledgeBaseManager()

# In-memory data store (replace with database in production)
users_db = {}
sessions_db = {}
reports_db = {}
training_db = {}
posts_db = []
emotion_records = {}


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '11.0.0', 'agents': 6})


# ============ User Management ============

@app.route('/api/user/register', methods=['POST'])
def register():
    data = request.json
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'name': data.get('name', ''),
        'phone': data.get('phone', ''),
        'email': data.get('email', ''),
        'culture_tag': data.get('culture_tag', 'other'),
        'created_at': datetime.now().isoformat(),
    }
    users_db[user_id] = user
    memory.init_user(user_id)
    return jsonify({'user': user, 'token': user_id})


@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = users_db.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user})


# ============ Emotion Assessment ============

@app.route('/api/emotion/assess', methods=['POST'])
def assess_emotion():
    data = request.json
    user_id = data.get('user_id')
    phq2 = data.get('phq2', [0, 0])
    gad2 = data.get('gad2', [0, 0])
    selected_emotion = data.get('emotion', '')

    phq2_total = sum(phq2)
    gad2_total = sum(gad2)

    if phq2_total <= 1 and gad2_total <= 1:
        bear_mood = 'happy'
        risk_level = 0
        message = '当前未发现明显心理情绪风险'
    elif phq2_total <= 3 and gad2_total <= 3:
        bear_mood = 'calm'
        risk_level = 1
        message = '存在轻度心理情绪困扰'
    else:
        bear_mood = 'tired'
        risk_level = 2
        message = '心理情绪风险较高'

    record = {
        'user_id': user_id,
        'emotion': selected_emotion,
        'phq2': phq2,
        'gad2': gad2,
        'phq2_total': phq2_total,
        'gad2_total': gad2_total,
        'bear_mood': bear_mood,
        'risk_level': risk_level,
        'message': message,
        'timestamp': datetime.now().isoformat(),
    }

    if user_id not in emotion_records:
        emotion_records[user_id] = []
    emotion_records[user_id].append(record)

    memory.save_emotion(user_id, record)

    return jsonify(record)


# ============ Chat / Counseling ============

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message', '')
    mode = data.get('mode', 'text')

    user = users_db.get(user_id, {})
    culture_tag = user.get('culture_tag', 'other')

    # Sensing analysis
    sensing_result = sensing.analyze(message, mode)

    # Counselor response
    response = counselor.respond(message, culture_tag, sensing_result)

    # Orchestrator decides flow
    flow_decision = orchestrator.decide_flow(user_id, message, sensing_result)

    # Memory save
    memory.save_conversation(user_id, {
        'user_message': message,
        'panda_response': response,
        'sensing': sensing_result,
        'flow': flow_decision,
    })

    return jsonify({
        'response': response,
        'sensing': sensing_result,
        'flow': flow_decision,
    })


# ============ Report Generation ============

@app.route('/api/report/generate', methods=['POST'])
def generate_report():
    data = request.json
    user_id = data.get('user_id')

    user = users_db.get(user_id, {})
    history = memory.get_history(user_id)
    emotions = emotion_records.get(user_id, [])

    report = insight_report.generate(
        user=user,
        history=history,
        emotions=emotions,
    )

    report_id = str(uuid.uuid4())
    report['id'] = report_id
    report['user_id'] = user_id
    report['timestamp'] = datetime.now().isoformat()

    if user_id not in reports_db:
        reports_db[user_id] = []
    reports_db[user_id].append(report)

    return jsonify(report)


@app.route('/api/report/<user_id>', methods=['GET'])
def get_reports(user_id):
    reports = reports_db.get(user_id, [])
    return jsonify({'reports': reports})


# ============ Training ============

@app.route('/api/training/types', methods=['GET'])
def get_training_types():
    return jsonify({'types': coach.get_training_types()})


@app.route('/api/training/complete', methods=['POST'])
def complete_training():
    data = request.json
    user_id = data.get('user_id')
    training_type = data.get('type')
    duration = data.get('duration')
    feeling = data.get('feeling')

    record = {
        'user_id': user_id,
        'type': training_type,
        'duration': duration,
        'feeling': feeling,
        'completed': True,
        'timestamp': datetime.now().isoformat(),
    }

    if user_id not in training_db:
        training_db[user_id] = []
    training_db[user_id].append(record)

    memory.save_training(user_id, record)

    return jsonify(record)


# ============ Growth Records ============

@app.route('/api/growth/<user_id>', methods=['GET'])
def get_growth(user_id):
    emotions = emotion_records.get(user_id, [])
    trainings = training_db.get(user_id, [])
    reports = reports_db.get(user_id, [])

    # Calculate interaction days
    user = users_db.get(user_id, {})
    created_at = user.get('created_at', datetime.now().isoformat())
    days = (datetime.now() - datetime.fromisoformat(created_at)).days + 1

    return jsonify({
        'emotions': emotions,
        'trainings': trainings,
        'reports': reports,
        'interaction_days': days,
    })


# ============ Community ============

@app.route('/api/community/posts', methods=['GET'])
def get_posts():
    post_type = request.args.get('type', 'all')
    if post_type == 'all':
        return jsonify({'posts': posts_db})
    filtered = [p for p in posts_db if p.get('type') == post_type]
    return jsonify({'posts': filtered})


@app.route('/api/community/posts', methods=['POST'])
def create_post():
    data = request.json
    post = {
        'id': str(uuid.uuid4()),
        'author': data.get('author', '匿名'),
        'avatar': data.get('avatar', '🐼'),
        'culture_tag': data.get('culture_tag', 'other'),
        'type': data.get('type', 'experience'),
        'title': data.get('title', ''),
        'content': data.get('content', ''),
        'likes': 0,
        'comments': [],
        'created_at': datetime.now().isoformat(),
    }
    posts_db.insert(0, post)
    return jsonify(post)


@app.route('/api/community/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    for post in posts_db:
        if post['id'] == post_id:
            post['likes'] += 1
            return jsonify(post)
    return jsonify({'error': 'Post not found'}), 404


@app.route('/api/community/posts/<post_id>/comment', methods=['POST'])
def comment_post(post_id):
    data = request.json
    for post in posts_db:
        if post['id'] == post_id:
            comment = {
                'id': str(uuid.uuid4()),
                'author': data.get('author', '匿名'),
                'content': data.get('content', ''),
                'created_at': datetime.now().isoformat(),
            }
            post['comments'].append(comment)
            return jsonify(post)
    return jsonify({'error': 'Post not found'}), 404


# ============ Knowledge Base ============

@app.route('/api/kb/query', methods=['POST'])
def query_kb():
    data = request.json
    kb_name = data.get('kb', '')
    query = data.get('query', '')
    culture_tag = data.get('culture_tag')
    results = kb_manager.query(kb_name, query, culture_tag)
    return jsonify({'results': results})


@app.route('/api/kb/relevant', methods=['POST'])
def relevant_kb():
    data = request.json
    context = data.get('context', '')
    culture_tag = data.get('culture_tag')
    results = kb_manager.get_relevant_knowledge(context, culture_tag)
    return jsonify({'results': results})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
