FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend-v12/package.json frontend-v12/package-lock.json ./
RUN npm ci
COPY frontend-v12/ ./
RUN npm run build


FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080 \
    AUTH_COOKIE_SECURE=true

WORKDIR /app/backend
COPY backend-v12/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend-v12/ ./
COPY --from=frontend-builder /build/frontend/dist /app/frontend-v12/dist

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
