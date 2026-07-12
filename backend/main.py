"""Panda Hug — FastAPI 主入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from config import config
from orchestrator import CognitiveOrchestrator as Orchestrator
from knowledge import KnowledgeBase
from api.routes import router, set_orchestrator
from api.voice import router as voice_router
from api.emotion import router as emotion_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Panda Hug",
        description="温暖跨文化心理伴侣 — 多 Agent 心理咨询系统",
        version="0.1.0",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 初始化知识库和调度器
    kb = KnowledgeBase(
        use_chroma=config.USE_CHROMA,
        source_dir=config.KNOWLEDGE_BASE_DIR or None,
    )
    orch = Orchestrator(knowledge_base=kb)
    set_orchestrator(orch)

    # 注册路由
    app.include_router(router)
    app.include_router(voice_router, prefix="/api")
    app.include_router(emotion_router, prefix="/api")

    # 静态文件（前端构建产物）
    frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
    if os.path.exists(frontend_dist):
        app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            file_path = os.path.join(frontend_dist, full_path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(frontend_dist, "index.html"))

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
