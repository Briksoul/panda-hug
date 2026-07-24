"""Minimal username/password account API."""
from __future__ import annotations

import time
import unicodedata
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import (
    AUTH_COOKIE_NAME,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from config import config
from database import ChatSessionRecord, User, get_db


router = APIRouter(prefix="/auth")

IDENTITY_TO_FRONTEND = {
    "chinese_in_us": "china_in_us",
    "american_in_china": "us_in_china",
}
IDENTITY_FROM_FRONTEND = {
    value: key for key, value in IDENTITY_TO_FRONTEND.items()
}


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    name: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=32)
    email: str = Field(default="", max_length=255)
    cultural_identity: str = Field(default="unknown", max_length=50)
    language: str = Field(default="zh", max_length=10)
    study_abroad_months: int = Field(default=0, ge=0, le=600)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class PreferencesRequest(BaseModel):
    language: str = Field(pattern="^(zh|en)$")


def normalize_username(username: str) -> str:
    normalized = unicodedata.normalize("NFKC", username).strip().casefold()
    if not normalized:
        raise HTTPException(400, "Username is required")
    return normalized


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "cultureTag": IDENTITY_TO_FRONTEND.get(
            user.cultural_identity,
            user.cultural_identity,
        ),
        "language": user.language,
        "studyAbroadMonths": user.study_abroad_months,
        "registered": True,
    }


def set_auth_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=create_access_token(user_id),
        max_age=config.JWT_EXPIRE_HOURS * 3600,
        httponly=True,
        secure=config.AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    response: Response,
    database: Session = Depends(get_db),
):
    username = normalize_username(request.username)
    existing = database.scalar(select(User).where(User.username == username))
    if existing:
        raise HTTPException(409, "Username is already registered")

    user = User(
        id=str(uuid.uuid4()),
        username=username,
        password_hash=hash_password(request.password),
        name=request.name.strip() or request.username.strip(),
        phone=request.phone.strip(),
        email=request.email.strip(),
        cultural_identity=IDENTITY_FROM_FRONTEND.get(
            request.cultural_identity,
            request.cultural_identity,
        ),
        language=request.language if request.language in ("zh", "en") else "zh",
        study_abroad_months=request.study_abroad_months,
        created_at=time.time(),
    )
    database.add(user)
    try:
        database.commit()
    except IntegrityError as exc:
        database.rollback()
        raise HTTPException(409, "Username is already registered") from exc
    database.refresh(user)
    set_auth_cookie(response, user.id)
    return {"user": serialize_user(user)}


@router.post("/login")
def login(
    request: LoginRequest,
    response: Response,
    database: Session = Depends(get_db),
):
    username = normalize_username(request.username)
    user = database.scalar(select(User).where(User.username == username))
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(401, "Invalid username or password")
    set_auth_cookie(response, user.id)
    return {"user": serialize_user(user)}


@router.get("/me")
def current_user(user: User = Depends(get_current_user)):
    return {"user": serialize_user(user)}


@router.patch("/preferences")
def update_preferences(
    request: PreferencesRequest,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    user.language = request.language
    sessions = database.scalars(
        select(ChatSessionRecord).where(ChatSessionRecord.user_id == user.id)
    ).all()
    for session in sessions:
        state = dict(session.state or {})
        profile = dict(state.get("profile", {}))
        profile["language"] = request.language
        state["profile"] = profile
        session.state = state
    database.commit()
    database.refresh(user)
    return {"user": serialize_user(user)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=config.AUTH_COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )
    return {"status": "ok"}
