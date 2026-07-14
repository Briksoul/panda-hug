FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    USE_CHROMA=true \
    KNOWLEDGE_BASE_DIR=/app/knowledge_base \
    CHROMA_PERSIST_DIR=/app/backend/data/chromadb

WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY knowledge_base/ /app/knowledge_base/
COPY --from=frontend-builder /build/frontend/dist/ /app/frontend/dist/

RUN mkdir -p \
    /app/backend/data/sessions \
    /app/backend/data/users \
    /app/backend/data/chromadb

WORKDIR /app/backend
EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
