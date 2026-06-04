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
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 1024

    # 向量数据库
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./data/chromadb")
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # 服务器
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list = None

    # 心理咨询
    CRISIS_THRESHOLD: float = 0.7  # 危机检测阈值
    SESSION_TIMEOUT_MINUTES: int = 60

    def __post_init__(self):
        if self.CORS_ORIGINS is None:
            self.CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]


config = Config()
