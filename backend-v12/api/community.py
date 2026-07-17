"""社区 API — 帖子、评论、点赞"""
from __future__ import annotations

import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/community")

# ─── 数据库 ─────────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent.parent / "data" / "community.db"


def _get_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def _db():
    conn = _get_db()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """初始化社区表（启动时调用）"""
    with _db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS posts (
                id          TEXT PRIMARY KEY,
                author      TEXT NOT NULL DEFAULT '匿名',
                avatar      TEXT NOT NULL DEFAULT '🐼',
                culture_tag TEXT NOT NULL DEFAULT 'unknown',
                type        TEXT NOT NULL DEFAULT 'experience',
                title       TEXT NOT NULL,
                content     TEXT NOT NULL,
                likes       INTEGER NOT NULL DEFAULT 0,
                created_at  REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS comments (
                id         TEXT PRIMARY KEY,
                post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                author     TEXT NOT NULL DEFAULT '匿名',
                content    TEXT NOT NULL,
                created_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS likes (
                user_id    TEXT NOT NULL,
                post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                created_at REAL NOT NULL,
                PRIMARY KEY (user_id, post_id)
            );
            CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
            CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
        """)


# ─── 请求/响应模型 ──────────────────────────────────────────────────
class CreatePostReq(BaseModel):
    author: str = Field(default="匿名", max_length=50)
    avatar: str = Field(default="🐼", max_length=10)
    culture_tag: str = Field(default="unknown", max_length=50)
    type: str = Field(default="experience", max_length=20)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)


class CreateCommentReq(BaseModel):
    author: str = Field(default="匿名", max_length=50)
    content: str = Field(min_length=1, max_length=2000)


class LikeReq(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)


def _time_ago(ts: float) -> str:
    diff = time.time() - ts
    if diff < 60:
        return "刚刚"
    if diff < 3600:
        return f"{int(diff // 60)}分钟前"
    if diff < 86400:
        return f"{int(diff // 3600)}小时前"
    days = int(diff // 86400)
    if days < 30:
        return f"{days}天前"
    return f"{days // 30}个月前"


def _post_dict(row: sqlite3.Row, comment_count: int = 0) -> dict:
    return {
        "id": row["id"],
        "author": row["author"],
        "avatar": row["avatar"],
        "culture_tag": row["culture_tag"],
        "type": row["type"],
        "title": row["title"],
        "content": row["content"],
        "likes": row["likes"],
        "comments": comment_count,
        "time": _time_ago(row["created_at"]),
        "created_at": row["created_at"],
    }


# ─── 路由 ──────────────────────────────────────────────────────────
@router.get("/posts")
async def list_posts(
    type: str = Query(default="all", max_length=20),
    q: str = Query(default="", max_length=200),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    """获取帖子列表（支持分类筛选 + 搜索 + 分页）"""
    offset = (page - 1) * size
    conditions = []
    params: list = []

    if type and type != "all":
        conditions.append("p.type = ?")
        params.append(type)

    if q:
        conditions.append("(p.title LIKE ? OR p.content LIKE ?)")
        params.extend([f"%{q}%", f"%{q}%"])

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with _db() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM posts p {where}", params
        ).fetchone()[0]

        rows = conn.execute(
            f"""SELECT p.* FROM posts p
                {where}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?""",
            params + [size, offset],
        ).fetchall()

        posts = []
        for row in rows:
            cc = conn.execute(
                "SELECT COUNT(*) FROM comments WHERE post_id = ?", (row["id"],)
            ).fetchone()[0]
            posts.append(_post_dict(row, cc))

    return {"posts": posts, "total": total, "page": page, "size": size}


@router.post("/posts")
async def create_post(req: CreatePostReq):
    """发布帖子"""
    post_id = uuid.uuid4().hex[:12]
    now = time.time()
    with _db() as conn:
        conn.execute(
            """INSERT INTO posts (id, author, avatar, culture_tag, type, title, content, likes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (post_id, req.author, req.avatar, req.culture_tag, req.type, req.title, req.content, now),
        )
    return {
        "id": post_id,
        "author": req.author,
        "avatar": req.avatar,
        "culture_tag": req.culture_tag,
        "type": req.type,
        "title": req.title,
        "content": req.content,
        "likes": 0,
        "comments": 0,
        "time": "刚刚",
        "created_at": now,
    }


@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    """获取单个帖子详情"""
    with _db() as conn:
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            raise HTTPException(404, "帖子不存在")
        cc = conn.execute(
            "SELECT COUNT(*) FROM comments WHERE post_id = ?", (post_id,)
        ).fetchone()[0]
        comments = conn.execute(
            "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
            (post_id,),
        ).fetchall()
    return {
        **_post_dict(row, cc),
        "comment_list": [
            {
                "id": c["id"],
                "author": c["author"],
                "content": c["content"],
                "time": _time_ago(c["created_at"]),
            }
            for c in comments
        ],
    }


@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, req: LikeReq):
    """切换点赞（同一用户只能点赞一次）"""
    with _db() as conn:
        post = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(404, "帖子不存在")

        existing = conn.execute(
            "SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?",
            (req.user_id, post_id),
        ).fetchone()

        if existing:
            conn.execute(
                "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
                (req.user_id, post_id),
            )
            conn.execute(
                "UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?",
                (post_id,),
            )
            liked = False
        else:
            conn.execute(
                "INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)",
                (req.user_id, post_id, time.time()),
            )
            conn.execute(
                "UPDATE posts SET likes = likes + 1 WHERE id = ?",
                (post_id,),
            )
            liked = True

        new_count = conn.execute(
            "SELECT likes FROM posts WHERE id = ?", (post_id,)
        ).fetchone()[0]

    return {"liked": liked, "likes": new_count}


@router.get("/posts/{post_id}/comments")
async def list_comments(post_id: str):
    """获取帖子评论列表"""
    with _db() as conn:
        post = conn.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(404, "帖子不存在")
        rows = conn.execute(
            "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
            (post_id,),
        ).fetchall()
    return {
        "comments": [
            {
                "id": c["id"],
                "author": c["author"],
                "content": c["content"],
                "time": _time_ago(c["created_at"]),
            }
            for c in rows
        ]
    }


@router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, req: CreateCommentReq):
    """添加评论"""
    comment_id = uuid.uuid4().hex[:12]
    now = time.time()
    with _db() as conn:
        post = conn.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(404, "帖子不存在")
        conn.execute(
            "INSERT INTO comments (id, post_id, author, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (comment_id, post_id, req.author, req.content, now),
        )
        count = conn.execute(
            "SELECT COUNT(*) FROM comments WHERE post_id = ?", (post_id,)
        ).fetchone()[0]
    return {
        "id": comment_id,
        "author": req.author,
        "content": req.content,
        "time": "刚刚",
        "comment_count": count,
    }
