"""Hume EVI WebSocket 代理 — 将前端音频流转发到 Hume EVI"""
import asyncio
import base64
import json
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from hume.client import AsyncHumeClient

# 加载 .env
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

HUME_API_KEY = os.getenv("HUME_API_KEY", "")
HUME_CONFIG_ID = os.getenv("HUME_CONFIG_ID", "")

router = APIRouter()


@router.websocket("/ws/voice/{session_id}")
async def voice_proxy(ws: WebSocket, session_id: str):
    """
    前端 ↔ 后端 WebSocket 代理
    前端发送: { "type": "audio", "data": "<base64 pcm>" }
    后端发送: { "type": "audio", "data": "<base64>" }
              { "type": "transcript", "role": "user"|"assistant", "text": "..." }
              { "type": "emotion", "scores": {...} }
              { "type": "error", "message": "..." }
    """
    await ws.accept()
    print(f"[Voice] Session {session_id} connected")

    if not HUME_API_KEY:
        await ws.send_json({"type": "error", "message": "HUME_API_KEY not configured"})
        await ws.close()
        return

    client = AsyncHumeClient(api_key=HUME_API_KEY)

    try:
        # 连接 Hume EVI WebSocket
        async with client.empathic_voice.chat.connect(
            config_id=HUME_CONFIG_ID or None
        ) as hume_socket:
            print(f"[Voice] Hume EVI connected for session {session_id}")

            # 双向代理
            async def forward_to_hume():
                """前端音频 → Hume EVI"""
                try:
                    while True:
                        data = await ws.receive_json()
                        if data.get("type") == "audio":
                            # 前端发送 base64 编码的 PCM 音频
                            audio_bytes = base64.b64decode(data["data"])
                            await hume_socket.send_audio(audio_bytes)
                        elif data.get("type") == "text":
                            # 文本消息（备用）
                            await hume_socket.send_text(data["text"])
                except WebSocketDisconnect:
                    print(f"[Voice] Frontend disconnected: {session_id}")
                except Exception as e:
                    print(f"[Voice] Forward error: {e}")

            async def forward_to_frontend():
                """Hume EVI 响应 → 前端"""
                try:
                    async for message in hume_socket:
                        msg_type = getattr(message, "type", None)

                        if msg_type == "audio_output":
                            # Hume 返回的语音音频
                            await ws.send_json({
                                "type": "audio",
                                "data": message.data,  # base64
                            })

                        elif msg_type in ("user_message", "assistant_message"):
                            # 转录文本 + 情绪分数
                            role = message.message.role
                            content = message.message.content
                            emotions = {}
                            if hasattr(message.models, "prosody") and message.models.prosody:
                                emotions = dict(message.models.prosody.scores or {})

                            await ws.send_json({
                                "type": "transcript",
                                "role": role,
                                "text": content,
                            })

                            if emotions:
                                # 取 top 5 情绪
                                top = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:5]
                                await ws.send_json({
                                    "type": "emotion",
                                    "scores": dict(top),
                                })

                        elif msg_type == "chat_metadata":
                            await ws.send_json({
                                "type": "metadata",
                                "chat_id": message.chat_id,
                            })

                        elif msg_type == "error":
                            await ws.send_json({
                                "type": "error",
                                "message": message.message,
                            })

                        else:
                            print(f"[Voice] Unknown message type: {msg_type}")

                except Exception as e:
                    print(f"[Voice] Hume receive error: {e}")
                    await ws.send_json({"type": "error", "message": str(e)})

            # 并行运行双向代理
            await asyncio.gather(forward_to_hume(), forward_to_frontend())

    except Exception as e:
        print(f"[Voice] Connection error: {e}")
        await ws.send_json({"type": "error", "message": f"Connection failed: {e}"})
    finally:
        print(f"[Voice] Session {session_id} ended")
        try:
            await ws.close()
        except Exception:
            pass
