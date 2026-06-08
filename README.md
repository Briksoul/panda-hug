# 🐼 Panda Hug V4 — 跨文化智能心理伴侣

多 Agent 网页版心理咨询系统，支持跨文化心理分析、RAG 知识库和智能干预。

## V4 架构

```
用户输入 → 首页介绍 → 阶段1:懂你情绪 → 阶段2:陪你倾诉 → 阶段3:看见自己 → 阶段4:一起练习
                ↑           ↑              ↑              ↑              ↑
                └───────────┴──────────────┴──────────────┴──────────────┘
                           主页导航 + 超链接跳转（双路径）
```

### 7 个 Agent

| Agent | 角色 | 职责 |
|-------|------|------|
| **Cognitive Orchestrator** | 大脑 | 调度全局、控制对话进度、切换阶段 |
| **Counselor Agent** | 前台 | 建立咨询关系、进行对话、情绪与事件探索 |
| **Sensing Agent** | 分析员 | 监测文本情绪数据，计算焦虑/抑郁指数 |
| **Risk Agent** | 守门员 | 识别自伤、自杀、危机词汇，触发紧急干预 |
| **Case Formulation Agent** | 侦探 | 提取核心事件、行为模式，构建用户心理模型 |
| **Insight Report Agent** | 报告员 | 整合分析结果，生成5模块心理报告 |
| **Coach Agent** | 教练 | 引导放松训练（呼吸、正念等），记录训练效果 |

### 6 个 RAG 知识库

| 知识库 | 条目数 | 用途 |
|--------|--------|------|
| 心理科普库 | 5 | 积极心理学、正念、情绪调节 |
| 心理咨询技术库 | 43 | 咨询师话术、共情技术 |
| 心理机制库 | 70 | 心理学理论、发展心理学 |
| 文化特征库 | 300 | 中国/美国/留学生文化特征 |
| 事件库 | 116 | 学业、社交、家庭等压力事件 |
| 危机转介库 | 5 | 危机干预资源、热线电话 |

### 4 阶段流程

1. **懂你情绪** — 情绪选择 + PHQ-2/GAD-2 量表评估
2. **陪你倾诉** — 文字/语音/视频咨询，多 Agent 协作
3. **看见自己** — 5模块心理洞察报告
4. **一起练习** — 呼吸、正念、音乐等放松训练

### 导航系统

- **路径A**：阶段结束 → 点击蓝色超链接关键字（如「陪你倾诉」）→ 直接进入下一功能
- **路径B**：随时返回主页 → 点击功能按钮 → 进入对应阶段
- 侧边栏流程进度也可点击导航

## 快速开始

### 1. 设置 API Key

```bash
export OPENAI_API_KEY=sk-your-key-here
```

### 2. 安装依赖

```bash
# 后端
cd backend && pip3 install -r requirements.txt

# 前端
cd frontend && npm install
```

### 3. 解析知识库

```bash
cd backend && python3 knowledge/parse_kb.py
```

### 4. 启动

```bash
chmod +x start.sh
./start.sh
```

或分别启动：

```bash
# 终端 1：后端
cd backend && python3 main.py

# 终端 2：前端
cd frontend && npx vite
```

### 5. 访问

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 技术栈

- **后端：** Python FastAPI + OpenAI API
- **前端：** React + Vite + TailwindCSS
- **知识库：** JSON + ChromaDB（可选向量检索）
- **通信：** RESTful API
- **双语：** 中/英文界面

## 目录结构

```
panda-harmony/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── config.py             # 配置
│   ├── agents/               # 7 个 Agent
│   ├── orchestrator/         # 调度器（4阶段流程）
│   ├── knowledge/            # 6层 RAG 知识库
│   └── api/                  # API 路由
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # 主组件
│   │   ├── components/       # UI 组件
│   │   │   ├── WelcomeScreen.jsx  # 语言选择 + 介绍
│   │   │   ├── HomePage.jsx       # 主页功能卡片
│   │   │   ├── PhaseNavigation.jsx # 阶段导航栏
│   │   │   ├── ChatWindow.jsx     # 对话窗口
│   │   │   ├── MessageBubble.jsx  # 消息气泡（含超链接）
│   │   │   ├── Sidebar.jsx        # 侧边栏
│   │   │   └── InsightReport.jsx  # 心理报告
│   │   └── utils/api.js      # API 工具
│   └── dist/                 # 构建产物
├── start.sh                  # 启动脚本
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/session/create | 创建会话 |
| POST | /api/chat | 发送消息 |
| POST | /api/navigate | 导航到指定阶段 |
| GET | /api/session/{id}/state | 获取会话状态 |
| GET | /api/session/{id}/history | 获取会话历史 |
