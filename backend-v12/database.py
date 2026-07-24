"""Shared SQLAlchemy database for authentication and application data."""
from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Optional

from sqlalchemy import (
    JSON,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    event,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from config import config


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100), default="")
    phone: Mapped[str] = mapped_column(String(32), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    cultural_identity: Mapped[str] = mapped_column(String(50), default="unknown")
    language: Mapped[str] = mapped_column(String(10), default="zh")
    study_abroad_months: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[float] = mapped_column(Float)


class ChatSessionRecord(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    state: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[float] = mapped_column(Float)
    last_active: Mapped[float] = mapped_column(Float, index=True)


class UserMemoryRecord(Base):
    __tablename__ = "user_memories"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    data: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[float] = mapped_column(Float)


class EmotionAssessment(Base):
    __tablename__ = "emotion_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    selected_emotion: Mapped[str] = mapped_column(String(32))
    assessment_type: Mapped[str] = mapped_column(String(20), default="phq_gad")
    phq2_score: Mapped[int] = mapped_column(Integer)
    gad2_score: Mapped[int] = mapped_column(Integer)
    bear_status: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[float] = mapped_column(Float, index=True)


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    author: Mapped[str] = mapped_column(String(100), default="匿名")
    avatar: Mapped[str] = mapped_column(String(20), default="🐼")
    culture_tag: Mapped[str] = mapped_column(String(50), default="unknown")
    type: Mapped[str] = mapped_column(String(20), default="experience")
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[float] = mapped_column(Float, index=True)


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    post_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("community_posts.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    author: Mapped[str] = mapped_column(String(100), default="匿名")
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[float] = mapped_column(Float)


class CommunityLike(Base):
    __tablename__ = "community_likes"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    post_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("community_posts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[float] = mapped_column(Float)


class CommunityFollow(Base):
    __tablename__ = "community_follows"

    follower_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    followed_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[float] = mapped_column(Float)


class CommunityMessage(Base):
    __tablename__ = "community_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sender_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    recipient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[float] = mapped_column(Float, index=True)
    read_at: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class MedicalResource(Base):
    __tablename__ = "medical_resources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    resource_type: Mapped[str] = mapped_column(String(24), index=True)
    country: Mapped[str] = mapped_column(String(8), index=True)
    region: Mapped[str] = mapped_column(String(100), index=True)
    region_zh: Mapped[str] = mapped_column(String(100), default="")
    name: Mapped[str] = mapped_column(String(255))
    organization: Mapped[str] = mapped_column(String(255), default="")
    phones: Mapped[list] = mapped_column(JSON)
    emails: Mapped[list] = mapped_column(JSON)
    websites: Mapped[list] = mapped_column(JSON)
    other_contacts: Mapped[list] = mapped_column(JSON)
    address: Mapped[str] = mapped_column(String(500), default="")
    schedule: Mapped[str] = mapped_column(String(500), default="")
    specialties: Mapped[list] = mapped_column(JSON)
    source_url: Mapped[str] = mapped_column(String(1000), default="")
    verification_status: Mapped[str] = mapped_column(String(64))


Index("idx_community_posts_created", CommunityPost.created_at.desc())


def _engine_options() -> dict:
    if config.DATABASE_URL.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False, "timeout": 30}}
    return {"pool_pre_ping": True, "pool_recycle": 1800}


if config.DATABASE_URL.startswith("sqlite:///"):
    database_path = Path(config.DATABASE_URL.removeprefix("sqlite:///"))
    database_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(config.DATABASE_URL, **_engine_options())
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


if config.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _configure_sqlite(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()


def init_database() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()


@contextmanager
def session_scope():
    database = SessionLocal()
    try:
        yield database
        database.commit()
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()
