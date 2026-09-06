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

import os
import json
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

CONFIG_DIR = Path.home() / ".config" / "reddit_scraper"
CONFIG_FILE = CONFIG_DIR / "config.json"


class RedditConfig:
    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        user_agent: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        session_cookie: Optional[str] = None,
    ):
        # 1. First check local .env
        load_dotenv()

        # 2. Check config.json if exists
        saved_config = self._load_file_config()

        # Precedence: passed args > env vars > config.json
        self.client_id = client_id or os.getenv("REDDIT_CLIENT_ID") or saved_config.get("client_id")
        self.client_secret = client_secret or os.getenv("REDDIT_CLIENT_SECRET") or saved_config.get("client_secret")
        self.user_agent = (
            user_agent
            or os.getenv("REDDIT_USER_AGENT")
            or saved_config.get("user_agent")
            or "python:reddit_scraper:v1.0 (by /u/anonymous)"
        )
        self.username = username or os.getenv("REDDIT_USERNAME") or saved_config.get("username")
        self.password = password or os.getenv("REDDIT_PASSWORD") or saved_config.get("password")
        self.session_cookie = session_cookie or os.getenv("REDDIT_SESSION_COOKIE") or saved_config.get("session_cookie")

    @property
    def has_oauth_credentials(self) -> bool:
        return bool(self.client_id and self.client_secret)

    @property
    def has_cookie_credentials(self) -> bool:
        return bool(self.session_cookie)

    @property
    def is_authenticated(self) -> bool:
        return self.has_oauth_credentials or self.has_cookie_credentials

    @staticmethod
    def _load_file_config() -> dict:
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def save(self):
        """Save current configuration to ~/.config/reddit_scraper/config.json"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "user_agent": self.user_agent,
            "username": self.username,
            "password": self.password,
            "session_cookie": self.session_cookie,
        }
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
