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

const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const CONFIG_DIR = path.join(os.homedir(), '.config', 'reddit_scraper');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

class RedditConfig {
  constructor(options = {}) {
    const fileConfig = this._loadFileConfig();

    this.clientId = options.clientId || process.env.REDDIT_CLIENT_ID || fileConfig.clientId || null;
    this.clientSecret = options.clientSecret || process.env.REDDIT_CLIENT_SECRET || fileConfig.clientSecret || null;
    this.userAgent =
      options.userAgent ||
      process.env.REDDIT_USER_AGENT ||
      fileConfig.userAgent ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    this.username = options.username || process.env.REDDIT_USERNAME || fileConfig.username || null;
    this.password = options.password || process.env.REDDIT_PASSWORD || fileConfig.password || null;
    this.sessionCookie = options.sessionCookie || process.env.REDDIT_SESSION_COOKIE || fileConfig.sessionCookie || null;
    this.proxy = options.proxy || process.env.REDDIT_PROXY || fileConfig.proxy || null;
    this.timeout = options.timeout || 15000;
  }

  get hasOAuthCredentials() {
    return Boolean(this.clientId && this.clientSecret);
  }

  get hasCookieCredentials() {
    return Boolean(this.sessionCookie);
  }

  get isAuthenticated() {
    return this.hasOAuthCredentials || this.hasCookieCredentials;
  }

  _loadFileConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  save() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const data = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      userAgent: this.userAgent,
      username: this.username,
      password: this.password,
      sessionCookie: this.sessionCookie,
      proxy: this.proxy,
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  static get configPath() {
    return CONFIG_FILE;
  }
}

module.exports = {
  RedditConfig,
  CONFIG_DIR,
  CONFIG_FILE,
};
