"""Panda Hug 配置"""
import os
from pathlib import Path
from dataclasses import dataclass

# 加载 .env 文件
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


@dataclass
class Config:
    # LLM
    OPENAI_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek-chat")
    LLM_FAST_MODEL: str = os.getenv("LLM_FAST_MODEL", "deepseek-chat")
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "4096"))

    # Hume EVI
    HUME_API_KEY: str = os.getenv("HUME_API_KEY", "")
    HUME_SECRET_KEY: str = os.getenv("HUME_SECRET_KEY", "")
    HUME_CONFIG_ID: str = os.getenv("HUME_CONFIG_ID", "")

    # 向量数据库
    CHROMA_PERSIST_DIR: str = os.getenv(
        "CHROMA_PERSIST_DIR",
        str(Path(__file__).parent / "data" / "chromadb"),
    )
    KNOWLEDGE_BASE_DIR: str = os.getenv("KNOWLEDGE_BASE_DIR", "")
    USE_CHROMA: bool = os.getenv("USE_CHROMA", "true").lower() in (
        "1", "true", "yes", "on",
    )
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # 服务器
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "5002"))
    CORS_ORIGINS: list = None

    # 心理咨询
    CRISIS_THRESHOLD: float = 0.7  # 危机检测阈值
    SESSION_TIMEOUT_MINUTES: int = 60

    def __post_init__(self):
        if self.CORS_ORIGINS is None:
            self.CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]


config = Config()
