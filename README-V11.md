# Panda Hug V11 - 跨文化智能情绪陪伴App

## 项目结构

```
panda-harmony/
├── frontend-v11/          # React 前端
│   ├── src/
│   │   ├── pages/         # 7个页面
│   │   │   ├── WelcomePage.jsx    # 欢迎页
│   │   │   ├── RegisterPage.jsx   # 注册/文化身份选择
│   │   │   ├── EmotionPage.jsx    # 功能1：懂你情绪
│   │   │   ├── ReportPage.jsx     # 功能2：看见自己
│   │   │   ├── TrainingPage.jsx   # 功能3：一起训练
│   │   │   ├── GrowthPage.jsx     # 功能4：成长记录
│   │   │   ├── CommunityPage.jsx  # 功能5：互助社区
│   │   │   └── ChatPage.jsx       # 对话界面
│   │   ├── components/    # 组件
│   │   │   ├── PandaFace.jsx      # 熊猫表情SVG
│   │   │   └── BottomNav.jsx      # 底部导航
│   │   └── hooks/
│   │       └── useUser.jsx        # 用户状态管理
│   └── dist/              # 构建产物
│
├── backend-v11/           # Flask 后端
│   ├── main.py            # 主入口 + API路由
│   ├── agents/            # 6个智能体
│   │   ├── orchestrator.py    # Cognitive Orchestrator - 大脑
│   │   ├── counselor.py       # Counselor Agent - 前台
│   │   ├── sensing.py         # Sensing Agent - 分析员
│   │   ├── insight_report.py  # Insight Report Agent - 报告员
│   │   ├── coach.py           # Coach Agent - 教练
│   │   └── memory.py          # Memory Agent - 记忆管理员
│   └── knowledge_bases/   # 8个知识库
│       ├── manager.py                 # 知识库管理器
│       ├── psych_psychoeducation.py   # 心理科普库
│       ├── psych_techniques.py        # 心理咨询技术库
│       ├── psych_mechanisms.py        # 心理机制库
│       ├── crisis_referral.py         # 危机转介库
│       ├── culture_traits.py          # 文化特征库
│       ├── case_events.py             # 案例事件库
│       ├── intervention_tips.py       # 干预技巧库
│       └── medical_resources.py       # 医疗资源推荐库
```

## 运行方式

### 前端
```bash
cd frontend-v11
npm install --registry=https://registry.npmmirror.com
npm run dev
# 访问 http://localhost:3000
```

### 后端
```bash
cd backend-v11
pip install flask flask-cors python-dotenv
python main.py
# API运行在 http://localhost:5001
```

## 功能列表

| 功能 | 名称 | 说明 |
|------|------|------|
| 功能1 | 懂你情绪 | 情绪选择 → PHQ-2/GAD-2量表 → 小熊状态 → 对话入口 |
| 功能2 | 看见自己 | 7模块心理洞察报告（状态/事件/机制/文化/需求/干预/寄语） |
| 功能3 | 一起训练 | 4种训练（4-7-8呼吸/方块呼吸/正念/自然冥想） |
| 功能4 | 成长记录 | 日历视图/情绪趋势/问题占比/互动等级 |
| 功能5 | 互助社区 | 发帖/评论/点赞/徽章（每周三开放） |

## 6个智能体

| 智能体 | 角色 | 职责 |
|--------|------|------|
| Cognitive Orchestrator | 大脑 | 调度全局、文化身份识别、流程控制 |
| Counselor Agent | 前台 | 咨询式对话、文化适配引导 |
| Sensing Agent | 分析员 | 文本/语音/视频情绪分析、危机检测 |
| Insight Report Agent | 报告员 | 生成7模块心理洞察报告 |
| Coach Agent | 教练 | 引导放松训练、记录完成情况 |
| Memory Agent | 记忆管理员 | 存储历史、生成趋势总结 |

## 8个知识库

1. 心理科普库（针对中美留学生）
2. 心理咨询技术库（分成中/美）
3. 心理机制库
4. 危机转介库
5. 文化特征库（中国/美国/跨文化适应阶段）
6. 案例事件库（中美留学生典型事件）
7. 干预技巧库（匹配不同情绪问题）
8. 医疗资源推荐库
