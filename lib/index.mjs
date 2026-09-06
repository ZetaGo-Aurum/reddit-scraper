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

import cjsModule from './index.js';

export const {
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
  formatForBot,
  extractMedia,
  extractRawMedia,
  downloadMedia,
  isFfmpegAvailable,
  SubredditWatcher,
  createApiServer,
  getMockPosts,
  getMockPostWithComments,
  getMockSubredditInfo,
  getMockUserProfile,
  RedditAuthenticationError,
  RedditRateLimitError,
  RedditApiError,
} = cjsModule;

export default cjsModule.RedditScraper;
