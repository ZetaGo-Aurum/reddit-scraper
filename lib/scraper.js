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

const { RedditClient } = require('./client');
const { Post, Comment, SubredditInfo, UserProfile } = require('./models');
const { exportToJson, exportToCsv, exportToMarkdown } = require('./utils');

class RedditScraper {
  constructor(clientOrConfig = null) {
    if (clientOrConfig instanceof RedditClient) {
      this.client = clientOrConfig;
    } else {
      this.client = new RedditClient(clientOrConfig);
    }
  }

  /**
   * Search Reddit posts across all Reddit or restricted to a specific subreddit.
   * 
   * @param {Object} options
   * @param {string} options.query - Search query string
   * @param {string} [options.subreddit] - Optional subreddit to restrict search to
   * @param {'relevance'|'hot'|'top'|'new'|'comments'} [options.sort='relevance']
   * @param {'all'|'hour'|'day'|'week'|'month'|'year'} [options.timeFilter='all']
   * @param {number} [options.limit=25]
   * @param {string} [options.after]
   * @returns {Promise<Post[]>}
   */
  async search({
    query,
    subreddit = null,
    sort = 'relevance',
    timeFilter = 'all',
    limit = 25,
    after = null,
  }) {
    if (!query) throw new Error('Search query is required');

    const params = {
      q: query,
      sort,
      t: timeFilter,
      limit: Math.min(limit, 100),
    };
    if (after) params.after = after;

    let path = '/search';
    if (subreddit) {
      const cleanSub = subreddit.replace(/^r\//, '');
      path = `/r/${cleanSub}/search`;
      params.restrict_sr = 'on';
    }

    const data = await this.client.get(path, params);
    const posts = [];
    const children = data?.data?.children || [];

    for (const item of children) {
      if (item.kind === 't3') {
        posts.push(Post.fromRedditJson(item));
      }
    }

    return posts.slice(0, limit);
  }

  /**
   * Scrape posts from a subreddit (hot, new, top, rising).
   * 
   * @param {Object} options
   * @param {string} options.subreddit - Name of subreddit
   * @param {'hot'|'new'|'top'|'rising'} [options.sort='hot']
   * @param {'all'|'day'|'week'|'month'|'year'} [options.timeFilter='all']
   * @param {number} [options.limit=25]
   * @param {string} [options.after]
   * @returns {Promise<Post[]>}
   */
  async getSubredditPosts({
    subreddit,
    sort = 'hot',
    timeFilter = 'all',
    limit = 25,
    after = null,
  }) {
    if (!subreddit) throw new Error('Subreddit name is required');
    const cleanSub = subreddit.replace(/^r\//, '');

    const path = `/r/${cleanSub}/${sort}`;
    const params = {
      limit: Math.min(limit, 100),
    };
    if (sort === 'top') {
      params.t = timeFilter;
    }
    if (after) params.after = after;

    const data = await this.client.get(path, params);
    const posts = [];
    const children = data?.data?.children || [];

    for (const item of children) {
      if (item.kind === 't3') {
        posts.push(Post.fromRedditJson(item));
      }
    }

    return posts.slice(0, limit);
  }

  /**
   * Get metadata, description, rules, and subscriber metrics for a subreddit.
   * 
   * @param {string} subreddit - Name of subreddit
   * @returns {Promise<SubredditInfo>}
   */
  async getSubredditAbout(subreddit) {
    if (!subreddit) throw new Error('Subreddit name is required');
    const cleanSub = subreddit.replace(/^r\//, '');
    const path = `/r/${cleanSub}/about`;

    const data = await this.client.get(path);
    return SubredditInfo.fromRedditJson(data);
  }

  /**
   * Scrape a full Reddit post and its nested comment tree.
   * 
   * @param {string} postIdOrUrl - Reddit Post ID (e.g. '1c1abcd') or full permalink / URL
   * @param {Object} [options]
   * @param {'confidence'|'top'|'new'|'controversial'|'old'} [options.sort='confidence']
   * @param {number} [options.limit=50]
   * @param {number} [options.depth=3]
   * @returns {Promise<Post>}
   */
  async getPost(postIdOrUrl, { sort = 'confidence', limit = 50, depth = 3 } = {}) {
    if (!postIdOrUrl) throw new Error('Post ID or URL is required');

    let path = '';
    if (postIdOrUrl.includes('reddit.com') || postIdOrUrl.includes('/r/')) {
      const clean = postIdOrUrl.split('reddit.com').pop().split('?')[0];
      path = clean.replace(/\/$/, '');
    } else {
      path = `/comments/${postIdOrUrl}`;
    }

    const params = {
      sort,
      limit,
      depth,
    };

    const data = await this.client.get(path, params);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid post response returned by Reddit');
    }

    // data[0] contains post details
    const postListing = data[0]?.data?.children || [];
    if (postListing.length === 0) {
      throw new Error('Post not found');
    }
    const post = Post.fromRedditJson(postListing[0]);

    // data[1] contains comments tree
    if (data.length > 1 && data[1]?.data?.children) {
      const commentItems = data[1].data.children;
      for (const item of commentItems) {
        const comment = Comment.fromRedditJson(item, 0);
        if (comment) {
          post.comments.push(comment);
        }
      }
    }

    return post;
  }

  /**
   * Scrape public user profile, karma metrics, and account status.
   * 
   * @param {string} username - Reddit username (without u/)
   * @returns {Promise<UserProfile>}
   */
  async getUserProfile(username) {
    if (!username) throw new Error('Username is required');
    const cleanUser = username.replace(/^u\//, '');
    const path = `/user/${cleanUser}/about`;

    const data = await this.client.get(path);
    return UserProfile.fromRedditJson(data);
  }

  /**
   * Scrape submitted posts by a user.
   * 
   * @param {string} username - Reddit username
   * @param {Object} [options]
   * @param {'new'|'hot'|'top'} [options.sort='new']
   * @param {number} [options.limit=25]
   * @returns {Promise<Post[]>}
   */
  async getUserPosts(username, { sort = 'new', limit = 25 } = {}) {
    if (!username) throw new Error('Username is required');
    const cleanUser = username.replace(/^u\//, '');
    const path = `/user/${cleanUser}/submitted`;

    const data = await this.client.get(path, { sort, limit: Math.min(limit, 100) });
    const posts = [];
    const children = data?.data?.children || [];

    for (const item of children) {
      if (item.kind === 't3') {
        posts.push(Post.fromRedditJson(item));
      }
    }

    return posts.slice(0, limit);
  }

  /**
   * Scrape user comments.
   * 
   * @param {string} username - Reddit username
   * @param {Object} [options]
   * @param {'new'|'hot'|'top'} [options.sort='new']
   * @param {number} [options.limit=25]
   * @returns {Promise<Comment[]>}
   */
  async getUserComments(username, { sort = 'new', limit = 25 } = {}) {
    if (!username) throw new Error('Username is required');
    const cleanUser = username.replace(/^u\//, '');
    const path = `/user/${cleanUser}/comments`;

    const data = await this.client.get(path, { sort, limit: Math.min(limit, 100) });
    const comments = [];
    const children = data?.data?.children || [];

    for (const item of children) {
      if (item.kind === 't1') {
        const c = Comment.fromRedditJson(item, 0);
        if (c) comments.push(c);
      }
    }

    return comments.slice(0, limit);
  }

  /**
   * Utility helper to export scraped data
   */
  export(data, { format = 'json', filePath, title } = {}) {
    const ext = format.toLowerCase();
    if (ext === 'json') {
      return exportToJson(data, filePath);
    } else if (ext === 'csv') {
      return exportToCsv(data, filePath);
    } else if (ext === 'md' || ext === 'markdown') {
      return exportToMarkdown(data, filePath, title);
    }
    throw new Error(`Unsupported export format: ${format}`);
  }
}

module.exports = {
  RedditScraper,
};
