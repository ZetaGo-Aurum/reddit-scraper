# ====================================================================
#                 REDDIT SCRAPER CORE & CLI ENGINE
# ====================================================================
#  Author      : ZetaGo-Aurum
#  GitHub      : https://github.com/ZetaGo-Aurum
#  Repository  : https://github.com/ZetaGo-Aurum/reddit-scraper
#  License     : MIT
#
#  [NOTICE & WATERMARK]
#  DO NOT REMOVE THIS WATERMARK OR AUTHOR CREDITS!
#  This software is created and maintained by ZetaGo-Aurum.
#  All rights reserved. Unauthorized removal of this header is prohibited.
# ====================================================================

from __future__ import annotations
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class Comment(BaseModel):
    """Reddit Comment Model"""
    id: str
    author: str
    body: str
    score: int = 0
    created_utc: float
    permalink: str = ""
    parent_id: str = ""
    depth: int = 0
    replies: List[Comment] = Field(default_factory=list)

    @property
    def created_datetime(self) -> datetime:
        return datetime.fromtimestamp(self.created_utc, tz=timezone.utc)

    @classmethod
    def from_dict(cls, data: Dict[str, Any], depth: int = 0) -> Optional[Comment]:
        if data.get("kind") != "t1":
            return None
        cdata = data.get("data", {})
        
        replies_raw = cdata.get("replies")
        parsed_replies: List[Comment] = []
        if isinstance(replies_raw, dict):
            rdata = replies_raw.get("data", {}).get("children", [])
            for r in rdata:
                child = Comment.from_dict(r, depth=depth + 1)
                if child:
                    parsed_replies.append(child)

        return cls(
            id=cdata.get("id", ""),
            author=cdata.get("author", "[deleted]"),
            body=cdata.get("body", ""),
            score=cdata.get("score", 0),
            created_utc=cdata.get("created_utc", 0.0),
            permalink="https://www.reddit.com" + cdata.get("permalink", ""),
            parent_id=cdata.get("parent_id", ""),
            depth=depth,
            replies=parsed_replies,
        )


class Post(BaseModel):
    """Reddit Post / Submission Model"""
    id: str
    title: str
    author: str
    subreddit: str
    score: int = 0
    upvote_ratio: Optional[float] = None
    num_comments: int = 0
    created_utc: float
    url: str
    permalink: str
    selftext: str = ""
    is_self: bool = True
    is_video: bool = False
    over_18: bool = False
    link_flair_text: Optional[str] = None
    media_url: Optional[str] = None
    comments: List[Comment] = Field(default_factory=list)

    @property
    def created_datetime(self) -> datetime:
        return datetime.fromtimestamp(self.created_utc, tz=timezone.utc)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Post:
        pdata = data.get("data", data)
        
        # Extract media URL if present
        media_url = None
        if pdata.get("is_video") and pdata.get("media"):
            media_url = pdata["media"].get("reddit_video", {}).get("fallback_url")
        elif not pdata.get("is_self") and pdata.get("url"):
            media_url = pdata.get("url")

        return cls(
            id=pdata.get("id", ""),
            title=pdata.get("title", ""),
            author=pdata.get("author", "[deleted]"),
            subreddit=pdata.get("subreddit", ""),
            score=pdata.get("score", 0),
            upvote_ratio=pdata.get("upvote_ratio"),
            num_comments=pdata.get("num_comments", 0),
            created_utc=pdata.get("created_utc", 0.0),
            url=pdata.get("url", ""),
            permalink="https://www.reddit.com" + pdata.get("permalink", ""),
            selftext=pdata.get("selftext", ""),
            is_self=pdata.get("is_self", False),
            is_video=pdata.get("is_video", False),
            over_18=pdata.get("over_18", False),
            link_flair_text=pdata.get("link_flair_text"),
            media_url=media_url,
        )


class SubredditInfo(BaseModel):
    """Subreddit Details Model"""
    name: str
    display_name: str
    title: str
    public_description: str = ""
    description: str = ""
    subscribers: int = 0
    active_user_count: Optional[int] = None
    created_utc: float = 0.0
    over18: bool = False
    url: str = ""

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> SubredditInfo:
        sdata = data.get("data", data)
        return cls(
            name=sdata.get("name", ""),
            display_name=sdata.get("display_name", ""),
            title=sdata.get("title", ""),
            public_description=sdata.get("public_description", ""),
            description=sdata.get("description", ""),
            subscribers=sdata.get("subscribers", 0),
            active_user_count=sdata.get("active_user_count"),
            created_utc=sdata.get("created_utc", 0.0),
            over18=sdata.get("over18", False),
            url="https://www.reddit.com" + sdata.get("url", f"/r/{sdata.get('display_name', '')}/"),
        )


class UserProfile(BaseModel):
    """Reddit User Profile Model"""
    username: str
    id: str = ""
    created_utc: float = 0.0
    link_karma: int = 0
    comment_karma: int = 0
    total_karma: int = 0
    is_gold: bool = False
    is_mod: bool = False
    has_verified_email: Optional[bool] = None
    bio: str = ""
    icon_img: Optional[str] = None
    profile_url: str = ""

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> UserProfile:
        udata = data.get("data", data)
        sub = udata.get("subreddit", {})
        link_k = udata.get("link_karma", 0)
        comm_k = udata.get("comment_karma", 0)
        total_k = udata.get("total_karma", link_k + comm_k)
        
        return cls(
            username=udata.get("name", ""),
            id=udata.get("id", ""),
            created_utc=udata.get("created_utc", 0.0),
            link_karma=link_k,
            comment_karma=comm_k,
            total_karma=total_k,
            is_gold=udata.get("is_gold", False),
            is_mod=udata.get("is_mod", False),
            has_verified_email=udata.get("has_verified_email"),
            bio=sub.get("public_description", "") if sub else "",
            icon_img=udata.get("icon_img"),
            profile_url=f"https://www.reddit.com/user/{udata.get('name', '')}",
        )
