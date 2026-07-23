"""Import legacy JSON and SQLite data into one authenticated account."""
from __future__ import annotations

import argparse
import getpass
import json
import secrets
import sqlite3
import sys
import time
import uuid
from pathlib import Path

from sqlalchemy import select


BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from auth import hash_password  # noqa: E402
from database import (  # noqa: E402
    ChatSessionRecord,
    CommunityComment,
    CommunityLike,
    CommunityPost,
    User,
    UserMemoryRecord,
    init_database,
    session_scope,
)


DATA_DIR = BACKEND_DIR / "data"
USER_DIR = DATA_DIR / "users"
SESSION_DIR = DATA_DIR / "sessions"
COMMUNITY_DB = DATA_DIR / "community.db"
LIST_FIELDS = (
    "sessions",
    "observations",
    "emotion_history",
    "voice_analyses",
    "insight_reports",
    "training_records",
    "perma_history",
)


def _load_json_files(directory: Path) -> list[dict]:
    records = []
    for path in sorted(directory.glob("*.json")):
        try:
            records.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError) as exc:
            print(f"Skipped {path.name}: {exc}")
    return records


def _deduplicate(items: list, key_builder) -> list:
    result = []
    seen = set()
    for item in items:
        key = key_builder(item)
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def merge_memories(memories: list[dict], user_id: str) -> dict:
    if not memories:
        return {
            "user_id": user_id,
            "profile": {},
            "sessions": [],
            "observations": [],
            "emotion_history": [],
            "voice_analyses": [],
            "insight_reports": [],
            "training_records": [],
            "perma_history": [],
            "legacy_import_completed": True,
            "created_at": time.time(),
            "last_active": time.time(),
        }

    merged = dict(memories[0])
    merged["user_id"] = user_id
    merged["profile"] = {}
    for memory in memories:
        merged["profile"].update({
            key: value
            for key, value in memory.get("profile", {}).items()
            if value not in (None, "", "unknown")
        })
        for field in LIST_FIELDS:
            merged.setdefault(field, [])
            merged[field].extend(memory.get(field, []))
        if memory.get("last_active", 0) >= merged.get("last_active", 0):
            for field in (
                "latest_case_formulation",
                "latest_cultural_analysis",
                "dynamic_summary",
                "perma",
            ):
                if field in memory:
                    merged[field] = memory[field]
        merged["created_at"] = min(
            merged.get("created_at", time.time()),
            memory.get("created_at", time.time()),
        )
        merged["last_active"] = max(
            merged.get("last_active", 0),
            memory.get("last_active", 0),
        )

    merged["sessions"] = list(dict.fromkeys(merged.get("sessions", [])))
    for field in LIST_FIELDS[1:]:
        merged[field] = _deduplicate(
            merged.get(field, []),
            lambda item: (
                item.get("session_id"),
                item.get("timestamp", item.get("completed_at", 0)),
                item.get("user_message", item.get("technique", "")),
            ),
        )
    merged["legacy_import_completed"] = True
    return merged


def _create_or_get_user(
    username: str,
    password: str,
    memories: list[dict],
) -> tuple[User, bool]:
    normalized_username = username.strip().casefold()
    with session_scope() as database:
        existing = database.scalar(
            select(User).where(User.username == normalized_username)
        )
        if existing is not None:
            return existing, False

        profile = next(
            (
                memory.get("profile", {})
                for memory in memories
                if memory.get("profile")
            ),
            {},
        )
        user = User(
            id=str(uuid.uuid4()),
            username=normalized_username,
            password_hash=hash_password(password),
            name=profile.get("name") or username,
            phone="",
            email="",
            cultural_identity=profile.get("cultural_identity", "unknown"),
            language=profile.get("language", "zh"),
            study_abroad_months=int(profile.get("study_abroad_months", 0)),
            created_at=time.time(),
        )
        database.add(user)
        database.flush()
        return user, True


def _import_memory(user: User, memories: list[dict]) -> int:
    with session_scope() as database:
        existing = database.get(UserMemoryRecord, user.id)
        if existing and (existing.data or {}).get("legacy_import_completed"):
            return 0
        merged = merge_memories(memories, user.id)
        if existing is None:
            database.add(UserMemoryRecord(
                user_id=user.id,
                data=merged,
                updated_at=time.time(),
            ))
        else:
            existing.data = merged
            existing.updated_at = time.time()
        return sum(len(memory.get("observations", [])) for memory in memories)


def _import_sessions(user: User, sessions: list[dict]) -> int:
    imported = 0
    with session_scope() as database:
        for state in sessions:
            session_id = str(state.get("session_id", "")).strip()
            if not session_id:
                continue
            state.setdefault("profile", {})["user_id"] = user.id
            record = database.get(ChatSessionRecord, session_id)
            if record is None:
                database.add(ChatSessionRecord(
                    id=session_id,
                    user_id=user.id,
                    state=state,
                    created_at=float(state.get("created_at", time.time())),
                    last_active=float(state.get("last_active", time.time())),
                ))
                imported += 1
            elif record.user_id == user.id:
                record.state = state
                record.last_active = float(
                    state.get("last_active", record.last_active)
                )
    return imported


def _import_community(user: User) -> tuple[int, int, int]:
    if not COMMUNITY_DB.exists():
        return 0, 0, 0
    source = sqlite3.connect(str(COMMUNITY_DB))
    source.row_factory = sqlite3.Row
    counts = [0, 0, 0]
    try:
        with session_scope() as database:
            for row in source.execute("SELECT * FROM posts"):
                if database.get(CommunityPost, row["id"]) is None:
                    database.add(CommunityPost(
                        id=row["id"],
                        user_id=user.id,
                        author=row["author"],
                        avatar=row["avatar"],
                        culture_tag=row["culture_tag"],
                        type=row["type"],
                        title=row["title"],
                        content=row["content"],
                        likes=row["likes"],
                        created_at=row["created_at"],
                    ))
                    counts[0] += 1
            database.flush()
            for row in source.execute("SELECT * FROM comments"):
                if database.get(CommunityComment, row["id"]) is None:
                    database.add(CommunityComment(
                        id=row["id"],
                        post_id=row["post_id"],
                        user_id=user.id,
                        author=row["author"],
                        content=row["content"],
                        created_at=row["created_at"],
                    ))
                    counts[1] += 1
            for row in source.execute("SELECT * FROM likes"):
                key = {"user_id": user.id, "post_id": row["post_id"]}
                if database.get(CommunityLike, key) is None:
                    database.add(CommunityLike(
                        user_id=user.id,
                        post_id=row["post_id"],
                        created_at=row["created_at"],
                    ))
                    counts[2] += 1
    except sqlite3.OperationalError as exc:
        print(f"Community import skipped: {exc}")
    finally:
        source.close()
    return tuple(counts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", default="admin")
    parser.add_argument("--generate-password", action="store_true")
    args = parser.parse_args()

    password = (
        secrets.token_urlsafe(18)
        if args.generate_password
        else getpass.getpass("Initial admin password: ")
    )
    if len(password) < 8:
        raise SystemExit("Password must contain at least 8 characters")

    init_database()
    memories = _load_json_files(USER_DIR)
    sessions = _load_json_files(SESSION_DIR)
    user, created = _create_or_get_user(args.username, password, memories)
    observations = _import_memory(user, memories)
    imported_sessions = _import_sessions(user, sessions)
    posts, comments, likes = _import_community(user)

    print(f"Account: {user.username} ({'created' if created else 'existing'})")
    if created and args.generate_password:
        print(f"Temporary password: {password}")
    print(
        "Imported "
        f"{imported_sessions} sessions, {observations} observations, "
        f"{posts} posts, {comments} comments, and {likes} likes."
    )


if __name__ == "__main__":
    main()
