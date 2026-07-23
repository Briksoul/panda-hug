"""Server-side authentication for browser-based Hume EVI sessions."""
import asyncio
import base64
import hashlib
import hmac
import time

import httpx
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import config
from database import User

router = APIRouter()
HUME_TOKEN_URL = "https://api.hume.ai/oauth2-cc/token"
_token_lock = asyncio.Lock()
_cached_token = ""
_token_expires_at = 0.0


@router.post("/voice/token")
async def create_hume_access_token(
    user: User = Depends(get_current_user),
):
    global _cached_token, _token_expires_at

    uses_proxy = bool(
        config.HUME_TOKEN_PROXY_URL
        and config.HUME_TOKEN_PROXY_SECRET
    )
    if (
        not uses_proxy
        and (not config.HUME_API_KEY or not config.HUME_SECRET_KEY)
    ):
        raise HTTPException(
            status_code=503,
            detail="Hume EVI credentials are not configured",
        )

    if uses_proxy:
        expires_at = int(time.time()) + 60
        payload = base64.urlsafe_b64encode(
            f"{user.id}:{expires_at}".encode()
        ).decode().rstrip("=")
        signature = hmac.new(
            config.HUME_TOKEN_PROXY_SECRET.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return {
            "proxy_url": config.HUME_TOKEN_PROXY_URL,
            "proxy_grant": f"{payload}.{signature}",
            "config_id": config.HUME_CONFIG_ID,
        }

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
                    headers={
                        "User-Agent": (
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/124.0.0.0 Safari/537.36"
                        ),
                        "Accept": "application/json",
                    },
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
