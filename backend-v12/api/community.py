"""Shared-database community API."""
from __future__ import annotations

import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from auth import get_current_user, get_optional_user
from database import (
    CommunityComment,
    CommunityFollow,
    CommunityLike,
    CommunityMessage,
    CommunityPost,
    User,
    get_db,
    init_database,
)


router = APIRouter(prefix="/community")


def init_db() -> None:
    init_database()


class CreatePostReq(BaseModel):
    type: str = Field(default="experience", max_length=20)
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)


class CreateCommentReq(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageReq(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


def _time_ago(timestamp: float) -> str:
    difference = time.time() - timestamp
    if difference < 60:
        return "刚刚"
    if difference < 3600:
        return f"{int(difference // 60)}分钟前"
    if difference < 86400:
        return f"{int(difference // 3600)}小时前"
    days = int(difference // 86400)
    if days < 30:
        return f"{days}天前"
    return f"{days // 30}个月前"


def _post_dict(
    post: CommunityPost,
    comment_count: int = 0,
    is_following: bool = False,
    is_liked: bool = False,
) -> dict:
    return {
        "id": post.id,
        "author_id": post.user_id,
        "author": post.author,
        "avatar": post.avatar,
        "culture_tag": post.culture_tag,
        "type": post.type,
        "title": post.title,
        "content": post.content,
        "likes": post.likes,
        "comments": comment_count,
        "time": _time_ago(post.created_at),
        "created_at": post.created_at,
        "is_following": is_following,
        "is_liked": is_liked,
    }


@router.get("/posts")
def list_posts(
    type: str = Query(default="all", max_length=20),
    q: str = Query(default="", max_length=200),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_user),
    database: Session = Depends(get_db),
):
    query = select(CommunityPost)
    count_query = select(func.count()).select_from(CommunityPost)
    conditions = []
    if type and type != "all":
        conditions.append(CommunityPost.type == type)
    if q:
        pattern = f"%{q}%"
        conditions.append(or_(
            CommunityPost.title.like(pattern),
            CommunityPost.content.like(pattern),
        ))
    if conditions:
        query = query.where(*conditions)
        count_query = count_query.where(*conditions)

    total = database.scalar(count_query) or 0
    posts = database.scalars(
        query
        .order_by(CommunityPost.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    ).all()
    result = []
    for post in posts:
        comment_count = database.scalar(
            select(func.count())
            .select_from(CommunityComment)
            .where(CommunityComment.post_id == post.id)
        ) or 0
        is_following = bool(
            current_user
            and post.user_id
            and database.get(CommunityFollow, {
                "follower_id": current_user.id,
                "followed_id": post.user_id,
            })
        )
        is_liked = bool(
            current_user
            and database.get(CommunityLike, {
                "user_id": current_user.id,
                "post_id": post.id,
            })
        )
        result.append(_post_dict(
            post,
            comment_count,
            is_following,
            is_liked,
        ))
    return {"posts": result, "total": total, "page": page, "size": size}


@router.post("/posts")
def create_post(
    request: CreatePostReq,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    post = CommunityPost(
        id=str(uuid.uuid4()),
        user_id=user.id,
        author=user.name or user.username,
        avatar="🐼",
        culture_tag=user.cultural_identity,
        type=request.type,
        title=request.title,
        content=request.content,
        likes=0,
        created_at=time.time(),
    )
    database.add(post)
    database.commit()
    database.refresh(post)
    return _post_dict(post)


@router.get("/posts/{post_id}")
def get_post(
    post_id: str,
    database: Session = Depends(get_db),
):
    post = database.get(CommunityPost, post_id)
    if post is None:
        raise HTTPException(404, "帖子不存在")
    comments = database.scalars(
        select(CommunityComment)
        .where(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at.asc())
    ).all()
    return {
        **_post_dict(post, len(comments)),
        "comment_list": [
            {
                "id": comment.id,
                "author": comment.author,
                "content": comment.content,
                "time": _time_ago(comment.created_at),
                "created_at": comment.created_at,
            }
            for comment in comments
        ],
    }


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: str,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    post = database.get(CommunityPost, post_id)
    if post is None:
        raise HTTPException(404, "帖子不存在")
    key = {"user_id": user.id, "post_id": post_id}
    existing = database.get(CommunityLike, key)
    if existing is not None:
        database.delete(existing)
        post.likes = max(0, post.likes - 1)
        liked = False
    else:
        database.add(CommunityLike(
            user_id=user.id,
            post_id=post_id,
            created_at=time.time(),
        ))
        post.likes += 1
        liked = True
    database.commit()
    return {"liked": liked, "likes": post.likes}


@router.get("/posts/{post_id}/comments")
def list_comments(
    post_id: str,
    database: Session = Depends(get_db),
):
    if database.get(CommunityPost, post_id) is None:
        raise HTTPException(404, "帖子不存在")
    comments = database.scalars(
        select(CommunityComment)
        .where(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at.asc())
    ).all()
    return {
        "comments": [
            {
                "id": comment.id,
                "author": comment.author,
                "content": comment.content,
                "time": _time_ago(comment.created_at),
                "created_at": comment.created_at,
            }
            for comment in comments
        ],
    }


@router.post("/posts/{post_id}/comments")
def create_comment(
    post_id: str,
    request: CreateCommentReq,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    if database.get(CommunityPost, post_id) is None:
        raise HTTPException(404, "帖子不存在")
    comment = CommunityComment(
        id=str(uuid.uuid4()),
        post_id=post_id,
        user_id=user.id,
        author=user.name or user.username,
        content=request.content,
        created_at=time.time(),
    )
    database.add(comment)
    database.commit()
    count = database.scalar(
        select(func.count())
        .select_from(CommunityComment)
        .where(CommunityComment.post_id == post_id)
    ) or 0
    return {
        "id": comment.id,
        "author": comment.author,
        "content": comment.content,
        "time": "刚刚",
        "created_at": comment.created_at,
        "comment_count": count,
    }


@router.post("/users/{user_id}/follow")
def toggle_follow(
    user_id: str,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    if user_id == user.id:
        raise HTTPException(400, "不能关注自己")
    if database.get(User, user_id) is None:
        raise HTTPException(404, "用户不存在")
    key = {"follower_id": user.id, "followed_id": user_id}
    existing = database.get(CommunityFollow, key)
    if existing:
        database.delete(existing)
        following = False
    else:
        database.add(CommunityFollow(
            follower_id=user.id,
            followed_id=user_id,
            created_at=time.time(),
        ))
        following = True
    database.commit()
    return {"following": following}


@router.get("/me/badges")
def get_badges(
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    experience_count = database.scalar(
        select(func.count())
        .select_from(CommunityPost)
        .where(
            CommunityPost.user_id == user.id,
            CommunityPost.type == "experience",
        )
    ) or 0
    help_count = database.scalar(
        select(func.count())
        .select_from(CommunityPost)
        .where(
            CommunityPost.user_id == user.id,
            CommunityPost.type == "help",
        )
    ) or 0
    return {
        "experience_count": experience_count,
        "help_count": help_count,
        "badges": [
            {
                "id": "light",
                "name": "同行微光",
                "unlocked": experience_count >= 5,
                "progress": min(experience_count, 5),
                "target": 5,
            },
            {
                "id": "speaker",
                "name": "倾诉旅人",
                "unlocked": help_count >= 5,
                "progress": min(help_count, 5),
                "target": 5,
            },
            {
                "id": "helper",
                "name": "渡己渡人",
                "unlocked": experience_count >= 10 and help_count >= 10,
                "progress": min(experience_count, 10) + min(help_count, 10),
                "target": 20,
            },
            {
                "id": "solver",
                "name": "解忧同窗",
                "unlocked": experience_count >= 10,
                "progress": min(experience_count, 10),
                "target": 10,
            },
        ],
    }


def _require_follow(
    database: Session,
    follower_id: str,
    followed_id: str,
) -> None:
    if database.get(CommunityFollow, {
        "follower_id": follower_id,
        "followed_id": followed_id,
    }) is None:
        raise HTTPException(403, "关注后才能发送私信")


@router.get("/messages/{user_id}")
def get_messages(
    user_id: str,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    _require_follow(database, user.id, user_id)
    messages = database.scalars(
        select(CommunityMessage)
        .where(or_(
            and_(
                CommunityMessage.sender_id == user.id,
                CommunityMessage.recipient_id == user_id,
            ),
            and_(
                CommunityMessage.sender_id == user_id,
                CommunityMessage.recipient_id == user.id,
            ),
        ))
        .order_by(CommunityMessage.created_at.asc())
        .limit(200)
    ).all()
    return {
        "messages": [
            {
                "id": message.id,
                "sender_id": message.sender_id,
                "recipient_id": message.recipient_id,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in messages
        ]
    }


@router.post("/messages/{user_id}")
def send_private_message(
    user_id: str,
    request: MessageReq,
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    _require_follow(database, user.id, user_id)
    message = CommunityMessage(
        id=str(uuid.uuid4()),
        sender_id=user.id,
        recipient_id=user_id,
        content=request.content,
        created_at=time.time(),
        read_at=None,
    )
    database.add(message)
    database.commit()
    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "recipient_id": message.recipient_id,
        "content": message.content,
        "created_at": message.created_at,
    }
