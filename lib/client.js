/**
 * ====================================================================
 *                 REDDIT SCRAPER CORE & CLI ENGINE
 * ====================================================================
 *  Author      : ZetaGo-Aurum
 *  GitHub      : https://github.com/ZetaGo-Aurum
 *  Repository  : https://github.com/ZetaGo-Aurum/reddit-scraper
 *  License     : MIT
 *
 *  [NOTICE & WATERMARK]
 *  DO NOT REMOVE THIS WATERMARK OR AUTHOR CREDITS!
 *  This software is created and maintained by ZetaGo-Aurum.
 *  All rights reserved. Unauthorized removal of this header is prohibited.
 * ====================================================================
 */

'use strict';

const axios = require('axios');
const { RedditConfig } = require('./config');

class RedditAuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RedditAuthenticationError';
  }
}

class RedditRateLimitError extends Error {
  constructor(message, resetInSeconds = 5) {
    super(message);
    this.name = 'RedditRateLimitError';
    this.resetInSeconds = resetInSeconds;
  }
}

class RedditApiError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.name = 'RedditApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

class RedditClient {
  constructor(config = null) {
    this.config = config || new RedditConfig();
    this.token = null;
    this.tokenExpiry = 0;

    this.oauthTokenUrl = 'https://www.reddit.com/api/v1/access_token';
    this.oauthBaseUrl = 'https://oauth.reddit.com';
    this.publicBaseUrl = 'https://www.reddit.com';
  }

  async _getOAuthToken() {
    const now = Date.now() / 1000;
    if (this.token && now < this.tokenExpiry - 60) {
      return this.token;
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new RedditAuthenticationError(
        'Reddit API credentials (clientId and clientSecret) are required for OAuth2 access.'
      );
    }

    const authHeader = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    const params = new URLSearchParams();
    if (this.config.username && this.config.password) {
      params.append('grant_type', 'password');
      params.append('username', this.config.username);
      params.append('password', this.config.password);
    } else {
      params.append('grant_type', 'client_credentials');
    }

    try {
      const resp = await axios.post(this.oauthTokenUrl, params.toString(), {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'User-Agent': this.config.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: this.config.timeout,
      });

      if (resp.data.error) {
        throw new RedditAuthenticationError(`OAuth error: ${resp.data.error}`);
      }

      this.token = resp.data.access_token;
      const expiresIn = resp.data.expires_in || 3600;
      this.tokenExpiry = now + expiresIn;
      return this.token;
    } catch (err) {
      if (err instanceof RedditAuthenticationError) throw err;
      throw new RedditAuthenticationError(
        `Failed to obtain Reddit OAuth token: ${err.response?.data?.message || err.message}`
      );
    }
  }

  _getBrowserHeaders() {
    return {
      'User-Agent': this.config.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  async get(endpoint, params = {}) {
    let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // 1. OAuth2 Request Mode
    if (this.config.hasOAuthCredentials) {
      const token = await this._getOAuthToken();
      const url = `${this.oauthBaseUrl}${cleanPath}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'User-Agent': this.config.userAgent,
      };

      try {
        const resp = await axios.get(url, {
          params,
          headers,
          timeout: this.config.timeout,
        });
        return resp.data;
      } catch (err) {
        this._handleAxiosError(err);
      }
    }

    // 2. Cookie / Public JSON Mode
    // Reddit public JSON requires .json extension
    let publicPath = cleanPath;
    if (!publicPath.endsWith('.json')) {
      publicPath = publicPath.replace(/\/$/, '') + '.json';
    }

    const url = `${this.publicBaseUrl}${publicPath}`;
    const headers = this._getBrowserHeaders();

    if (this.config.sessionCookie) {
      headers['Cookie'] = `reddit_session=${this.config.sessionCookie}`;
    }

    try {
      const resp = await axios.get(url, {
        params: { raw_json: 1, ...params },
        headers,
        timeout: this.config.timeout,
        validateStatus: (status) => status < 500,
      });

      if (resp.status === 403) {
        throw new RedditAuthenticationError(
          'HTTP 403 Forbidden: Reddit has blocked direct anonymous scraping. ' +
          'Please configure OAuth credentials (REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET) or set a session cookie.'
        );
      }

      if (resp.status === 404) {
        throw new RedditApiError('Resource not found (HTTP 404)', 404, resp.data);
      }

      if (resp.status === 429) {
        const retryAfter = resp.headers['retry-after'] || 5;
        throw new RedditRateLimitError(`Rate limited by Reddit (HTTP 429). Retry in ${retryAfter}s`, retryAfter);
      }

      if (resp.status >= 400) {
        throw new RedditApiError(`Reddit API error: HTTP ${resp.status}`, resp.status, resp.data);
      }

      return resp.data;
    } catch (err) {
      if (err instanceof RedditAuthenticationError || err instanceof RedditRateLimitError || err instanceof RedditApiError) {
        throw err;
      }
      this._handleAxiosError(err);
    }
  }

  _handleAxiosError(err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 401 || status === 403) {
        throw new RedditAuthenticationError(`Authentication failed (HTTP ${status}): ${JSON.stringify(err.response.data)}`);
      }
      if (status === 429) {
        throw new RedditRateLimitError('Rate limit exceeded (HTTP 429)');
      }
      throw new RedditApiError(`HTTP error ${status}`, status, err.response.data);
    }
    throw new RedditApiError(`Network / Connection error: ${err.message}`, 0);
  }
}

module.exports = {
  RedditClient,
  RedditAuthenticationError,
  RedditRateLimitError,
  RedditApiError,
};
