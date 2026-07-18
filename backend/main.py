"""PANDA Harmony — FastAPI 主入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as chat_router
from api.voice import router as voice_router
from config import config

app = FastAPI(title="PANDA Harmony", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(chat_router, prefix="/api")
app.include_router(voice_router, prefix="/api")


@app.get("/")
def root():
    return {"name": "PANDA Harmony", "version": "2.0", "status": "running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "hume_configured": bool(config.OPENAI_API_KEY),
        "llm_model": config.LLM_MODEL,
    }
