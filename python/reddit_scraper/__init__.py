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

"""Reddit Scraper Package
Comprehensive scraper for Reddit: search, subreddits, posts, comments, and user profiles.
"""

from .models import Post, Comment, SubredditInfo, UserProfile
from .client import RedditClient
from .scraper import RedditScraper
from .config import RedditConfig

__all__ = [
    "Post",
    "Comment",
    "SubredditInfo",
    "UserProfile",
    "RedditClient",
    "RedditScraper",
    "RedditConfig",
]
