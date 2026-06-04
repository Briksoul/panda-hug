# 🐼 PANDA Harmony — 跨文化智能心理伴侣

多 Agent 网页版心理咨询系统，支持跨文化心理分析和智能干预。

## 架构

```
用户输入 → Sensing Agent (情感分析)
                ↓
         Orchestrator (调度器)
           ↙        ↘
    Triage Agent    Crisis Agent
    (初筛评估)      (危机干预)
           ↓
    Cultural Analyst Agent
    (跨文化心理剖析)
           ↓
    Coach Agent
    (身心融合训练)
```

### 5 个 Agent

| Agent | 职责 |
|-------|------|
| **Triage** | PHQ-2/GAD-2 筛查 + 身份确认 + 情绪分级 |
| **Sensing** | 文本情感分析 + 危机关键词检测（隐形运行） |
| **Cultural Analyst** | 跨文化认知重构（CBT/东方智慧） |
| **Coach** | 呼吸训练/冥想/音乐干预引导 |
| **Crisis** | 危机干预 + 安全计划 + 资源转介 |

### 4 层知识库

- 心理机制库（Psychological Mechanism KB）
- 文化特征库（Culture KB）
- 事件库（Event Patterns KB）
- 文化解释库（Cultural Interpretation KB）

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

### 3. 启动

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

### 4. 访问

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 技术栈

- **后端：** Python FastAPI + OpenAI API
- **前端：** React + Vite + TailwindCSS
- **知识库：** ChromaDB（向量检索）/ 关键词匹配（Phase 1）
- **通信：** RESTful API

## 目录结构

```
panda-harmony/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── config.py             # 配置
│   ├── agents/               # 5 个 Agent
│   ├── orchestrator/         # 调度器
│   ├── knowledge/            # 知识库
│   └── api/                  # API 路由
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # 主组件
│   │   ├── components/       # UI 组件
│   │   └── utils/            # API 工具
│   └── dist/                 # 构建产物
├── start.sh                  # 启动脚本
└── README.md
```
