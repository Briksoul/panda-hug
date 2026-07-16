"""Server-side authentication for browser-based Hume EVI sessions."""
import asyncio
import time

import httpx
from fastapi import APIRouter, HTTPException

from config import config

router = APIRouter()
HUME_TOKEN_URL = "https://api.hume.ai/oauth2-cc/token"
_token_lock = asyncio.Lock()
_cached_token = ""
_token_expires_at = 0.0


@router.post("/voice/token")
async def create_hume_access_token():
    global _cached_token, _token_expires_at

    if not config.HUME_API_KEY or not config.HUME_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Hume EVI credentials are not configured",
        )

    now = time.monotonic()
    if _cached_token and now < _token_expires_at:
        return {
            "access_token": _cached_token,
            "config_id": config.HUME_CONFIG_ID,
        }

    async with _token_lock:
        now = time.monotonic()
        if _cached_token and now < _token_expires_at:
            return {
                "access_token": _cached_token,
                "config_id": config.HUME_CONFIG_ID,
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    HUME_TOKEN_URL,
                    auth=httpx.BasicAuth(
                        config.HUME_API_KEY,
                        config.HUME_SECRET_KEY,
                    ),
                    data={"grant_type": "client_credentials"},
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail="Unable to authenticate with Hume EVI",
            ) from exc

        payload = response.json()
        access_token = payload.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=502,
                detail="Hume did not return an access token",
            )

        expires_in = int(payload.get("expires_in", 1800))
        _cached_token = access_token
        _token_expires_at = time.monotonic() + max(60, expires_in - 60)

        return {
            "access_token": access_token,
            "config_id": config.HUME_CONFIG_ID,
        }
