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

import csv
import json
from typing import List, Optional, Dict, Any, Union
from .models import Post, Comment, SubredditInfo, UserProfile
from .client import RedditClient


class RedditScraper:
    def __init__(self, client: Optional[RedditClient] = None):
        self.client = client or RedditClient()

    # ---------------------------------------------------------
    # 1. Search Scraping
    # ---------------------------------------------------------
    def search(
        self,
        query: str,
        subreddit: Optional[str] = None,
        sort: str = "relevance",  # relevance, hot, top, new, comments
        time_filter: str = "all",  # all, hour, day, week, month, year
        limit: int = 25,
    ) -> List[Post]:
        """
        Search Reddit for posts matching query.
        Optionally restrict to a specific subreddit.
        """
        params = {
            "q": query,
            "sort": sort,
            "t": time_filter,
            "limit": min(limit, 100),
        }
        if subreddit:
            path = f"/r/{subreddit}/search"
            params["restrict_sr"] = "on"
        else:
            path = "/search"

        data = self.client.get(path, params=params)
        posts: List[Post] = []
        children = data.get("data", {}).get("children", [])
        for item in children:
            if item.get("kind") == "t3":
                posts.append(Post.from_dict(item))
        return posts[:limit]

    # ---------------------------------------------------------
    # 2. Subreddit Scraping
    # ---------------------------------------------------------
    def get_subreddit_posts(
        self,
        subreddit: str,
        sort: str = "hot",  # hot, new, top, rising
        time_filter: str = "all",  # all, day, week, month, year (for top)
        limit: int = 25,
    ) -> List[Post]:
        """Scrape posts from a subreddit"""
        path = f"/r/{subreddit}/{sort}"
        params = {
            "limit": min(limit, 100),
        }
        if sort == "top":
            params["t"] = time_filter

        data = self.client.get(path, params=params)
        posts: List[Post] = []
        children = data.get("data", {}).get("children", [])
        for item in children:
            if item.get("kind") == "t3":
                posts.append(Post.from_dict(item))
        return posts[:limit]

    def get_subreddit_about(self, subreddit: str) -> SubredditInfo:
        """Get subreddit metadata, rules, subscriber count, description"""
        path = f"/r/{subreddit}/about"
        data = self.client.get(path)
        return SubredditInfo.from_dict(data)

    def get_post_with_comments(
        self,
        post_id_or_url: str,
        sort: str = "confidence",  # confidence, top, new, controversial, old
        limit: int = 50,
        depth: int = 3,
    ) -> Post:
        """
        Get full post details along with its comment tree.
        Accepts post ID (e.g. '1c1abcd') or full permalink.
        """
        if post_id_or_url.startswith("http") or "/r/" in post_id_or_url:
            # extract path
            parts = post_id_or_url.split("reddit.com")[-1].split("?")[0]
            path = parts.rstrip("/")
        else:
            path = f"/comments/{post_id_or_url}"

        params = {
            "sort": sort,
            "limit": limit,
            "depth": depth,
        }
        data = self.client.get(path, params=params)

        # Reddit returns a list of 2 items: [post_listing, comment_listing]
        if not isinstance(data, list) or len(data) < 2:
            raise ValueError(f"Unexpected response format for comments: {data}")

        post_data = data[0]["data"]["children"][0]
        post = Post.from_dict(post_data)

        comment_children = data[1]["data"]["children"]
        comments: List[Comment] = []
        for c in comment_children:
            parsed = Comment.from_dict(c, depth=0)
            if parsed:
                comments.append(parsed)

        post.comments = comments
        return post

    # ---------------------------------------------------------
    # 3. User Profile Scraping
    # ---------------------------------------------------------
    def get_user_profile(self, username: str) -> UserProfile:
        """Get user karma, created date, bio, avatar"""
        # Clean username
        user = username.replace("u/", "").replace("/u/", "").strip()
        path = f"/user/{user}/about"
        data = self.client.get(path)
        return UserProfile.from_dict(data)

    def get_user_posts(
        self,
        username: str,
        sort: str = "new",  # new, hot, top
        limit: int = 25,
    ) -> List[Post]:
        """Scrape submitted posts by a user"""
        user = username.replace("u/", "").replace("/u/", "").strip()
        path = f"/user/{user}/submitted"
        params = {"sort": sort, "limit": min(limit, 100)}
        data = self.client.get(path, params=params)
        posts: List[Post] = []
        children = data.get("data", {}).get("children", [])
        for item in children:
            if item.get("kind") == "t3":
                posts.append(Post.from_dict(item))
        return posts[:limit]

    def get_user_comments(
        self,
        username: str,
        sort: str = "new",
        limit: int = 25,
    ) -> List[Comment]:
        """Scrape comments by a user"""
        user = username.replace("u/", "").replace("/u/", "").strip()
        path = f"/user/{user}/comments"
        params = {"sort": sort, "limit": min(limit, 100)}
        data = self.client.get(path, params=params)
        comments: List[Comment] = []
        children = data.get("data", {}).get("children", [])
        for item in children:
            if item.get("kind") == "t1":
                c = Comment.from_dict(item)
                if c:
                    comments.append(c)
        return comments[:limit]

    # ---------------------------------------------------------
    # Export Helpers
    # ---------------------------------------------------------
    @staticmethod
    def export_json(data: Union[List[Any], Any], filepath: str):
        """Export scraped objects to JSON file"""
        if isinstance(data, list):
            dumpable = [item.model_dump() if hasattr(item, "model_dump") else item for item in data]
        else:
            dumpable = data.model_dump() if hasattr(data, "model_dump") else data

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(dumpable, f, indent=2, ensure_ascii=False)

    @staticmethod
    def export_posts_csv(posts: List[Post], filepath: str):
        """Export posts to CSV file"""
        fields = [
            "id", "title", "author", "subreddit", "score", "num_comments",
            "created_utc", "url", "permalink", "is_self", "link_flair_text"
        ]
        with open(filepath, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for p in posts:
                row = {k: getattr(p, k) for k in fields}
                writer.writerow(row)
