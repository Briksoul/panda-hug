"""Password hashing, JWT cookies, and authenticated-user dependencies."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from config import config
from database import User, get_db


AUTH_COOKIE_NAME = "panda_auth"
_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(hours=config.JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def _token_from_request(request: Request) -> str:
    token = request.cookies.get(AUTH_COOKIE_NAME, "")
    if token:
        return token
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        return authorization[7:]
    return ""


def get_current_user(
    request: Request,
    database: Session = Depends(get_db),
) -> User:
    token = _token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        user_id = str(payload.get("sub", ""))
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from exc
    user = database.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found",
        )
    return user


def get_optional_user(
    request: Request,
    database: Session = Depends(get_db),
) -> Optional[User]:
    try:
        return get_current_user(request, database)
    except HTTPException:
        return None
