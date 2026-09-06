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

import time
import requests
from typing import Optional, Dict, Any
from .config import RedditConfig

try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False


class RedditAuthenticationError(Exception):
    """Raised when authentication fails or is required by Reddit"""
    pass


class RedditRateLimitError(Exception):
    """Raised when rate limit is exceeded"""
    pass


class RedditClient:
    OAUTH_TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
    OAUTH_BASE_URL = "https://oauth.reddit.com"
    PUBLIC_BASE_URL = "https://www.reddit.com"

    def __init__(self, config: Optional[RedditConfig] = None):
        self.config = config or RedditConfig()
        self.token: Optional[str] = None
        self.token_expiry: float = 0.0
        self.session = requests.Session()
        self.cffi_session = cffi_requests.Session(impersonate="chrome124") if HAS_CURL_CFFI else None

    def _get_oauth_token(self) -> str:
        """Obtain or refresh OAuth2 token from Reddit"""
        if self.token and time.time() < self.token_expiry - 60:
            return self.token

        if not self.config.client_id or not self.config.client_secret:
            raise RedditAuthenticationError(
                "Reddit API credentials (client_id and client_secret) are required for OAuth2 access."
            )

        auth = requests.auth.HTTPBasicAuth(self.config.client_id, self.config.client_secret)
        headers = {"User-Agent": self.config.user_agent}

        if self.config.username and self.config.password:
            data = {
                "grant_type": "password",
                "username": self.config.username,
                "password": self.config.password,
            }
        else:
            data = {"grant_type": "client_credentials"}

        resp = self.session.post(self.OAUTH_TOKEN_URL, auth=auth, data=data, headers=headers, timeout=15)
        
        if resp.status_code != 200:
            raise RedditAuthenticationError(
                f"Failed to authenticate with Reddit OAuth (HTTP {resp.status_code}): {resp.text}"
            )

        json_data = resp.json()
        if "error" in json_data:
            raise RedditAuthenticationError(f"OAuth error: {json_data.get('error')}")

        self.token = json_data["access_token"]
        expires_in = json_data.get("expires_in", 3600)
        self.token_expiry = time.time() + expires_in
        return self.token

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        Execute GET request to Reddit.
        Automatically routes to OAuth2 if credentials are provided,
        or falls back to session cookie / browser impersonation.
        """
        params = params or {}
        # Ensure path starts with /
        if not path.startswith("/"):
            path = "/" + path

        # 1. OAuth2 Mode (Recommended)
        if self.config.has_oauth_credentials:
            token = self._get_oauth_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "User-Agent": self.config.user_agent,
            }
            url = f"{self.OAUTH_BASE_URL}{path}"
            resp = self.session.get(url, headers=headers, params=params, timeout=15)

            # Check rate limiting headers
            remaining = resp.headers.get("x-ratelimit-remaining")
            reset = resp.headers.get("x-ratelimit-reset")
            if remaining and float(remaining) < 1.0:
                wait_time = float(reset or 1.0)
                time.sleep(wait_time)

            if resp.status_code == 429:
                raise RedditRateLimitError(f"Reddit rate limit reached. Reset in {reset}s")
            elif resp.status_code != 200:
                raise RedditAuthenticationError(f"Reddit API error (HTTP {resp.status_code}): {resp.text}")

            return resp.json()

        # 2. Session Cookie Mode
        elif self.config.has_cookie_credentials and self.cffi_session:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Cookie": f"reddit_session={self.config.session_cookie}",
            }
            url = f"{self.PUBLIC_BASE_URL}{path}.json" if not path.endswith(".json") else f"{self.PUBLIC_BASE_URL}{path}"
            resp = self.cffi_session.get(url, headers=headers, params=params, timeout=15)
            if resp.status_code == 200 and "application/json" in resp.headers.get("content-type", ""):
                return resp.json()
            else:
                raise RedditAuthenticationError(
                    f"Reddit session cookie returned HTTP {resp.status_code}. The cookie might be expired or invalid."
                )

        # 3. Unauthenticated Mode
        else:
            if not self.cffi_session:
                raise RedditAuthenticationError(
                    "No credentials configured and curl_cffi is not available for anonymous requests."
                )

            url = f"{self.PUBLIC_BASE_URL}{path}.json" if not path.endswith(".json") else f"{self.PUBLIC_BASE_URL}{path}"
            resp = self.cffi_session.get(url, params=params, timeout=15)
            
            if resp.status_code == 200 and "application/json" in resp.headers.get("content-type", ""):
                return resp.json()
            elif resp.status_code in (403, 429) or "<title>Reddit - Prove your humanity</title>" in resp.text:
                raise RedditAuthenticationError(
                    "Reddit blocked unauthenticated request (anti-bot challenge / 403 Forbidden). "
                    "Please provide Reddit credentials (client_id + client_secret, or session cookie)."
                )
            else:
                raise RedditAuthenticationError(
                    f"Unexpected response from Reddit (HTTP {resp.status_code}): {resp.text[:200]}"
                )
