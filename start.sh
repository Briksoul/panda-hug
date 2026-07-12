#!/bin/bash
# PANDA Harmony 启动脚本

cd "$(dirname "$0")"

echo "🐼 PANDA Harmony — 跨文化智能心理伴侣"
echo "========================================"

# 检查 API key
HAS_ENV_KEY=false
if [ -f "backend/.env" ] && awk -F= '$1 == "OPENAI_API_KEY" && length($2) > 0 { found=1 } END { exit !found }' "backend/.env"; then
    HAS_ENV_KEY=true
fi
if [ -z "$OPENAI_API_KEY" ] && [ "$HAS_ENV_KEY" = false ]; then
    echo "⚠️  请设置 OPENAI_API_KEY 环境变量"
    echo "   export OPENAI_API_KEY=sk-your-key-here"
    echo ""
fi

# 启动后端
echo "🚀 启动后端 (FastAPI on :8000)..."
cd backend
python3 main.py &
BACKEND_PID=$!

# 等后端启动
sleep 2

# 启动前端
echo "🎨 启动前端 (Vite on :3000)..."
cd ../frontend
npx vite --port 3000 &
FRONTEND_PID=$!

echo ""
echo "✅ 启动完成！"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo "   API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止"

# 捕获退出
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
