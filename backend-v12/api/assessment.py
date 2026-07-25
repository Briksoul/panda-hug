"""Structured emotion check-ins and PHQ-2/GAD-2 assessments."""
from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user
from database import ChatSessionRecord, EmotionAssessment, User, get_db


router = APIRouter(prefix="/assessment")
TWO_WEEKS_SECONDS = 14 * 24 * 60 * 60


class AssessmentRequest(BaseModel):
    selected_emotion: str = Field(min_length=1, max_length=32)
    assessment_type: str = Field(default="phq_gad", pattern="^(checkin|phq_gad)$")
    phq2_score: int = Field(default=0, ge=0, le=6)
    gad2_score: int = Field(default=0, ge=0, le=6)


def _bear_status(phq2_score: int, gad2_score: int) -> str:
    maximum = max(phq2_score, gad2_score)
    if maximum <= 1:
        return "happy"
    if maximum <= 3:
        return "calm"
    return "tired"


def _latest(
    database: Session,
    user_id: str,
    assessment_type: str | None = None,
) -> EmotionAssessment | None:
    query = (
        select(EmotionAssessment)
        .where(EmotionAssessment.user_id == user_id)
        .order_by(EmotionAssessment.created_at.desc())
        .limit(1)
    )
    if assessment_type:
        query = query.where(
            EmotionAssessment.assessment_type == assessment_type
        )
    return database.scalar(query)


@router.get("/status")
def assessment_status(
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    latest_scale = _latest(database, user.id, "phq_gad")
    latest_checkin = _latest(database, user.id)
    now = time.time()
    return {
        "assessment_due": (
            latest_scale is None
            or now - latest_scale.created_at >= TWO_WEEKS_SECONDS
        ),
        "last_assessment_at": (
            latest_scale.created_at if latest_scale else None
        ),
        "latest": _serialize(latest_checkin) if latest_checkin else None,
    }


@router.post("")
def save_assessment(
    request: AssessmentRequest,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    bear_status = _bear_status(request.phq2_score, request.gad2_score)
    record = EmotionAssessment(
        id=str(uuid.uuid4()),
        user_id=user.id,
        selected_emotion=request.selected_emotion,
        assessment_type=request.assessment_type,
        phq2_score=request.phq2_score,
        gad2_score=request.gad2_score,
        bear_status=bear_status,
        created_at=time.time(),
    )
    database.add(record)

    if request.assessment_type == "phq_gad":
        sessions = database.scalars(
            select(ChatSessionRecord).where(
                ChatSessionRecord.user_id == user.id
            )
        ).all()
        for session in sessions:
            state = dict(session.state or {})
            profile = dict(state.get("profile", {}))
            profile["phq2_score"] = request.phq2_score
            profile["gad2_score"] = request.gad2_score
            maximum = max(request.phq2_score, request.gad2_score)
            profile["emotion_level"] = (
                "positive" if maximum <= 1
                else "mild" if maximum <= 3
                else "moderate"
            )
            state["profile"] = profile
            if (
                state.get("current_agent", "triage") == "triage"
                and not profile.get("crisis_triggered", False)
            ):
                state["current_agent"] = "counselor"
                state["phase"] = "counseling"
            # A running report worker will consume this flag; otherwise the
            # next report/history read starts a refresh with the new scores.
            state["report_refresh_pending"] = True
            session.state = state
    database.commit()
    return _serialize(record)


def _serialize(record: EmotionAssessment) -> dict:
    return {
        "id": record.id,
        "selected_emotion": record.selected_emotion,
        "assessment_type": record.assessment_type,
        "phq2_score": record.phq2_score,
        "gad2_score": record.gad2_score,
        "bear_status": record.bear_status,
        "created_at": record.created_at,
    }
