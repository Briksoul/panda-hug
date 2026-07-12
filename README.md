# 🐼 Panda Hug V6

Panda Hug 是面向跨文化场景的多智能体心理陪伴系统。系统提供心理初筛、支持性咨询、文化适应分析、心理训练、风险识别、跨会话记忆、成长记录和声学情绪辅助分析。

> Panda Hug 是心理健康支持工具，不是医疗诊断系统。PHQ-2、GAD-2、文本风险信号、Hume 声学表达和成长指标均不能替代专业评估。

## 在线体验

Railway 部署地址：[https://panda-hug-production.up.railway.app](https://panda-hug-production.up.railway.app)

生产环境的麦克风功能依赖 HTTPS、浏览器权限、Hume 服务状态和账户额度。

## 核心能力

- 多智能体咨询流程：初筛、咨询、跨文化分析、训练、风险处理、个案概念化、督导和洞察报告。
- 跨会话记忆：按稳定用户标识保存档案、互动、情绪、训练、报告和文化适应信息。
- 成长记录：聚合情绪趋势、问题分布、训练效果、PERMA 五维指标和文化适应 U 型曲线。
- 自助训练中心：记录训练前后困扰程度，并将训练效果映射到长期成长指标。
- 双语与跨文化档案：保存语言偏好、文化身份、留学时长和文化适应阶段。
- 流式交互：通过 Server-Sent Events 增量显示 Panda Hug 回复。
- 语音交互：支持浏览器原生语音和 Hume EVI 声学增强语音。
- 安全支持：本地 Guardrail、文本危机关键词、按需 Risk Agent 和 Crisis Agent。

## 系统架构

```text
React / Vite 前端
  ├─ 文本聊天、成长记录、训练中心、洞察报告
  ├─ 浏览器 Web Speech API
  └─ Hume EVI WebSocket
             │
             │ REST / SSE
             ▼
FastAPI API
             │
             ▼
CognitiveOrchestrator
  ├─ Sensing / Risk
  ├─ 前台 Agent：Triage → Counselor → Cultural → Coach
  ├─ 危机分支：Crisis
  ├─ 后台 Agent：Case Formulation / Supervisor / Insight Report
  ├─ 混合知识库：关键词检索 + ChromaDB
  └─ Memory Agent：会话状态 + 用户长期记忆
```

正常前台路径为：

```text
Triage → Counselor → Cultural Analyst → Coach → Counselor
```

出现明确危机信号时，系统转入 Crisis Agent。声学情绪只用于辅助理解，不会单独触发危机模式。

## 智能体

| Agent | 职责 |
| --- | --- |
| Sensing | 本地文本情绪、危机关键词和文本—声学融合 |
| Triage | PHQ-2、GAD-2、身份确认和情绪分级 |
| Counselor | 支持性咨询、探索和阶段推进 |
| Cultural Analyst | 跨文化压力、认知模式和文化适应分析 |
| Coach | 呼吸、正念、认知和行为训练 |
| Crisis | 危机支持、安全计划和资源转介 |
| Risk | 高风险情况下的进一步风险评估 |
| Case Formulation | 后台个案概念化 |
| Supervisor | 后台咨询质量评估与建议 |
| Insight Report | 异步生成结构化心理洞察报告 |
| Memory | 跨会话档案、长期摘要和成长数据聚合 |

复杂咨询和文化分析使用 `LLM_MODEL`。分诊、训练、督导和个案概念化等结构化任务使用 `LLM_FAST_MODEL`。Sensing 的基础文本分析使用本地规则。

## 知识库

知识库包含心理机制、文化特征、事件模式、文化解释、咨询技巧、危机干预和督导规则七个内置层，并支持从外部 Markdown 文档加载心理科普、咨询技巧、危机转介、文化特征和案例事件等扩展层。

检索同时执行关键词匹配和 ChromaDB 向量搜索，并按智能体角色与文化背景过滤。当前向量表示使用稳定哈希嵌入，不调用外部嵌入 API。

## 记忆与成长记录

会话状态保存在：

```text
backend/data/sessions/{session_id}.json
```

用户长期记忆保存在：

```text
backend/data/users/{user_id}.json
```

前端使用浏览器 `localStorage` 中的稳定 `user_id` 关联不同会话。当前实现没有账户、密码或服务端身份认证，因此只适用于原型验证，不适合直接用于多用户生产环境。

长期记忆包括用户档案、互动观察、情绪历史、声学分析、文化适应阶段、个案概念化、洞察报告、训练记录、PERMA 更新和规则生成的记忆摘要。

## 语音处理

浏览器语音路径使用 Web Speech API 转写用户语音，并通过 `speechSynthesis` 朗读 Panda Hug 回复。该路径不提供可靠的声学情绪分数。

Hume EVI 路径的处理顺序为：

```text
浏览器麦克风
→ Hume 实时转写与 48 维 Prosody 分数
→ Panda Hug 文本—声学融合
→ 多智能体生成唯一回复
→ SSE 流式显示
→ 浏览器 TTS 朗读
```

Hume 的自动助手被暂停并静音。Hume 只负责实时转写和声学表达测量，Panda Hug 负责心理支持和回复生成。Hume API Key 与 Secret Key 仅保存在后端，浏览器使用短期访问令牌连接 EVI。

## 技术栈

- 前端：React 19、Vite 6、TailwindCSS、Hume Voice React SDK。
- 后端：Python、FastAPI、Uvicorn、OpenAI-compatible API、HTTPX。
- 数据：JSON 会话与用户记忆、ChromaDB 持久化知识库。
- 通信：REST、SSE、Hume EVI WebSocket、Web Speech API。
- 模型：Gemini Pro 主模型与 Gemini Flash 快速模型，可替换为其他 OpenAI-compatible 模型。

## 快速开始

运行环境要求：

```text
Python 3.9+
Node.js 18+
npm 9+
```

安装依赖：

```bash
python3 -m pip install -r backend/requirements.txt
npm --prefix frontend install
```

复制配置模板：

```bash
cp backend/.env.example backend/.env
```

配置后端环境：

```env
OPENAI_API_KEY=你的大模型API密钥
OPENAI_BASE_URL=https://你的OpenAI兼容接口/v1
LLM_MODEL=gemini-3.1-pro-preview
LLM_FAST_MODEL=gemini-3.5-flash
LLM_MAX_TOKENS=4096

# 可选：Hume EVI
HUME_API_KEY=你的Hume API Key
HUME_SECRET_KEY=你的Hume Secret Key
HUME_CONFIG_ID=你的EVI配置ID

USE_CHROMA=true
# KNOWLEDGE_BASE_DIR=/absolute/path/to/knowledge_base
```

启动前后端：

```bash
bash start.sh
```

访问地址：

- 前端：[http://localhost:3000](http://localhost:3000)
- 后端 API：[http://localhost:8000](http://localhost:8000)
- API 文档：[http://localhost:8000/docs](http://localhost:8000/docs)

生产构建：

```bash
npm --prefix frontend run build
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

当前 JSON 持久化不支持多进程安全写入，因此生产原型应保持单个 Uvicorn worker。

## 关键 API

| API | 功能 |
| --- | --- |
| `POST /api/session/create` | 创建会话并关联稳定用户 |
| `POST /api/chat` | 非流式聊天 |
| `POST /api/chat/stream` | SSE 流式多智能体聊天 |
| `GET /api/session/{session_id}/state` | 获取会话与用户状态 |
| `GET /api/session/{session_id}/history` | 获取消息历史 |
| `GET /api/session/{session_id}/memory` | 获取长期记忆 |
| `GET /api/session/{session_id}/growth` | 获取成长记录 |
| `POST /api/session/{session_id}/training/self-guided` | 保存自助训练 |
| `POST /api/session/{session_id}/voice-analysis` | 独立保存声学分析 |
| `POST /api/voice/token` | 获取 Hume 临时访问令牌 |

## 目录结构

```text
panda-hug/
├── backend/
│   ├── agents/              # 11 个功能智能体
│   ├── api/                 # 会话、聊天、训练和语音 API
│   ├── data/                # 会话、用户记忆和 ChromaDB
│   ├── knowledge/           # 混合知识库
│   ├── orchestrator/        # CognitiveOrchestrator
│   ├── config.py
│   └── main.py
├── frontend/
│   └── src/
│       ├── components/      # 聊天、语音、训练、成长和导航
│       ├── hooks/
│       ├── utils/
│       └── App.jsx
├── docs/
│   ├── architecture-memory-voice.md
│   └── deployment.md
├── start.sh
└── README.md
```

## 文档

- [启动与部署说明](docs/deployment.md)
- [系统架构、记忆管理与语音处理设计说明](docs/architecture-memory-voice.md)

## 安全与隐私

项目处理心理健康文本、量表、文化身份和声学表达等敏感数据。正式生产使用前必须增加账户认证、访问控制、数据库事务、静态加密、审计、备份、数据删除机制和明确的录音同意。不要将 `.env`、API Key、Hume Secret Key 或临时访问令牌提交到版本控制。
