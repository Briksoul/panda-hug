# Panda Hug 启动与部署说明

本文档说明 Panda Hug 当前版本的本地启动、生产运行、环境配置、数据持久化和常见故障处理方式。

## 1. 运行要求

建议使用以下运行环境：

```text
macOS 或 Linux
Python 3.9+
Node.js 18+
npm 9+
```

当前开发机器使用 Python 3.9.6 和 Node.js 24。Hume React SDK 要求 Node.js 18 或更高版本。

项目需要访问大模型 API。启用 Hume 声学情绪功能时，还需要允许浏览器和后端访问 Hume API。生产环境中的麦克风功能必须运行在 HTTPS 或 localhost 安全上下文中。

## 2. 项目位置

以下命令默认项目位于：

```bash
cd /Users/raymone/Desktop/panda-hug/panda-hug
```

如果部署到其他机器，请将该路径替换为实际项目目录。

## 3. 安装依赖

安装后端依赖：

```bash
python3 -m pip install -r backend/requirements.txt
```

安装前端依赖：

```bash
npm --prefix frontend install
```

若使用 Python 虚拟环境，可执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r backend/requirements.txt
```

## 4. 配置环境变量

复制配置模板：

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
OPENAI_API_KEY=你的大模型API密钥
OPENAI_BASE_URL=https://你的OpenAI兼容接口/v1
LLM_MODEL=gemini-3.1-pro-preview
LLM_FAST_MODEL=gemini-3.5-flash
LLM_MAX_TOKENS=4096

HUME_API_KEY=你的Hume API Key
HUME_SECRET_KEY=你的Hume Secret Key
HUME_CONFIG_ID=你的EVI配置ID

USE_CHROMA=true
# KNOWLEDGE_BASE_DIR=/absolute/path/to/knowledge_base
```

`OPENAI_API_KEY`、`HUME_API_KEY` 和 `HUME_SECRET_KEY` 不得写入前端环境变量、代码、日志或版本控制。项目 `.gitignore` 已忽略 `.env` 文件。

Hume 配置是可选的。缺少 Hume 凭证时，文本聊天和浏览器原生语音仍可运行，但 Hume EVI 声学情绪功能不可用。

## 5. 本地一键启动

在项目根目录执行：

```bash
bash start.sh
```

启动后访问：

```text
前端：http://localhost:3000
后端：http://localhost:8000
API 文档：http://localhost:8000/docs
```

`start.sh` 同时启动 FastAPI 开发服务器和 Vite 开发服务器。终端保持运行时服务才会持续可用。按 `Ctrl+C` 停止两个服务。

该方式适合本地开发，不适合直接用于生产环境。

## 6. 分别启动前后端

后端终端：

```bash
cd backend
python3 main.py
```

前端终端：

```bash
cd frontend
npx vite --port 3000
```

分别启动便于查看日志和排查单个服务。

## 7. 验证服务

检查前端：

```bash
curl -s -o /dev/null -w "frontend=%{http_code}\n" http://localhost:3000
```

检查后端：

```bash
curl -s -o /dev/null -w "backend=%{http_code}\n" http://localhost:8000/docs
```

检查 Hume 临时令牌接口：

```bash
curl -X POST http://localhost:8000/api/voice/token
```

成功时 Hume 接口返回临时 `access_token` 和 `config_id`。不要将返回的访问令牌复制到日志、文档或聊天记录中。

浏览器端完整验证流程为：

```text
打开前端
→ 创建或恢复会话
→ 进入语音模式
→ 选择 Hume EVI
→ 允许麦克风权限
→ 说一段完整话语
→ 查看声学情绪、Panda Hug 回复和成长记录
```

## 8. 构建前端

生成生产前端资源：

```bash
npm --prefix frontend run build
```

构建结果位于：

```text
frontend/dist/
```

FastAPI 启动时会检测该目录，并提供前端静态文件和单页应用回退。因此，构建完成后可以只对外暴露后端服务端口。

## 9. 单机生产运行

先构建前端：

```bash
npm --prefix frontend install
npm --prefix frontend run build
```

再安装后端依赖并启动：

```bash
python3 -m pip install -r backend/requirements.txt
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

访问：

```text
http://服务器地址:8000
```

当前系统使用内存会话状态和本地 JSON 文件。生产运行必须保持 `--workers 1`。多个 Uvicorn Worker 会各自持有不同会话状态，并可能并发覆盖用户记忆文件。

建议使用 systemd、Supervisor 或其他进程管理器保持单个 Uvicorn 进程运行。不要使用 `python3 main.py` 作为生产启动命令，因为该方式启用了自动重载。

## 10. HTTPS 与反向代理

生产环境建议使用 Nginx、Caddy 或云平台网关提供 HTTPS，并将请求转发到：

```text
127.0.0.1:8000
```

浏览器麦克风通常只允许在 HTTPS 或 localhost 中使用。若直接通过公网 HTTP 地址访问，Hume EVI 和浏览器语音可能无法获得麦克风权限。

反向代理需要支持普通 HTTP、SSE 长连接和静态资源。Panda Hug 的 Hume EVI WebSocket由浏览器直接连接 Hume，不经过项目反向代理。

SSE 路由为：

```text
/api/chat/stream
```

代理层应关闭该路由的响应缓冲，并设置足够长的读取超时。

## 11. 网络访问要求

后端需要访问：

```text
OPENAI_BASE_URL 指定的大模型网关
https://api.hume.ai
```

浏览器需要访问：

```text
项目 HTTPS 域名
wss://api.hume.ai
```

部署在受限网络、校园网络或企业防火墙中时，需要允许上述 HTTPS 和 WebSocket 出站连接。

## 12. 持久化目录

以下目录包含运行数据：

```text
backend/data/sessions/
backend/data/users/
backend/data/chromadb/
```

`sessions/` 保存会话状态，`users/` 保存用户长期记忆，`chromadb/` 保存知识库索引。迁移服务器、容器重建或升级前，应备份这些目录。

如果使用容器或临时云实例，必须将 `backend/data/` 挂载到持久卷，否则重启实例后会丢失会话、长期记忆和向量索引。

当前数据文件未加密。包含真实心理健康数据时，应使用加密磁盘、严格文件权限和安全备份策略。

## 13. 更新代码后的操作

后端开发服务器会监控 Python 文件变化并自动重载。前端 Vite 会执行热更新。

修改依赖后需要重新安装：

```bash
python3 -m pip install -r backend/requirements.txt
npm --prefix frontend install
```

修改生产前端后需要重新构建：

```bash
npm --prefix frontend run build
```

生产后端修改后需要重启 Uvicorn 进程。

## 14. 常见问题

### 14.1 `vite: command not found`

前端依赖未安装。执行：

```bash
npm --prefix frontend install
```

### 14.2 端口被占用

检查进程：

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

停止旧的 Panda Hug 进程后重新启动。不要同时运行多个 `start.sh`。

### 14.3 Hume 显示未配置

确认 `backend/.env` 中同时存在：

```env
HUME_API_KEY=
HUME_SECRET_KEY=
```

修改 `.env` 后需要重启后端，因为运行中的配置对象不会自动重新读取环境文件。

### 14.4 Hume 无法获取麦克风

确认浏览器已授予麦克风权限，并通过 `https://` 或 `http://localhost` 访问。优先使用较新的 Chrome、Edge 或 Safari。

### 14.5 大模型连接失败

检查 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 和模型名称。确认服务器能够访问模型网关，并确认网关支持 OpenAI 兼容的 Chat Completions 和流式响应。

### 14.6 重启后历史为空

确认 `backend/data/` 仍然存在且当前进程有读写权限。浏览器中的 `panda_harmony_user_id` 和 `panda_harmony_session_id` 也必须保留，才能自动关联原有用户和会话。

## 15. 当前服务状态检查

本地开发时，可使用以下命令快速检查：

```bash
curl -s -o /dev/null -w "frontend=%{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "backend=%{http_code}\n" http://localhost:8000/docs
```

两个结果均为 `200` 时，前后端已正常启动。
