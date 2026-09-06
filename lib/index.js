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

const { RedditScraper } = require('./scraper');
const {
  RedditClient,
  RedditAuthenticationError,
  RedditRateLimitError,
  RedditApiError,
} = require('./client');
const { RedditConfig, CONFIG_DIR, CONFIG_FILE } = require('./config');
const { Post, Comment, SubredditInfo, UserProfile } = require('./models');
const {
  exportToJson,
  exportToCsv,
  exportToMarkdown,
  toCsvString,
  truncate,
} = require('./utils');

module.exports = {
  RedditScraper,
  RedditClient,
  RedditConfig,
  CONFIG_DIR,
  CONFIG_FILE,
  Post,
  Comment,
  SubredditInfo,
  UserProfile,
  exportToJson,
  exportToCsv,
  exportToMarkdown,
  toCsvString,
  truncate,
  RedditAuthenticationError,
  RedditRateLimitError,
  RedditApiError,
  default: RedditScraper,
};
