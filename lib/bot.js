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

const EventEmitter = require('events');

/**
 * Format post details into platform-optimized text for chatbots
 * (WhatsApp / Baileys, Discord, Telegram, or Plain Text).
 */
function formatForBot(post, options = {}) {
  const platform = (options.platform || 'whatsapp').toLowerCase();
  const maxTextLength = options.maxTextLength || 350;
  const includeMediaUrl = options.includeMediaUrl !== false;

  const title = post.title || 'Reddit Post';
  const author = post.author ? `u/${post.author}` : '[deleted]';
  const sub = post.subreddit ? `r/${post.subreddit}` : 'reddit';
  const score = (post.score || 0).toLocaleString();
  const comments = (post.numComments || 0).toLocaleString();
  const link = post.permalink || post.url || '';
  
  let body = post.selftext ? post.selftext.trim() : '';
  if (body.length > maxTextLength) {
    body = body.slice(0, maxTextLength - 3) + '...';
  }

  // 1. WhatsApp Formatting (*bold*, _italic_, ~strikethrough~, ```code```)
  if (platform === 'whatsapp' || platform === 'wa') {
    const lines = [
      `*${title}*`,
      `_by ${author} in *${sub}*_`,
      `📊 *Score:* ${score} | 💬 *Comments:* ${comments}`,
    ];
    if (body) {
      lines.push('', `> ${body.replace(/\n/g, '\n> ')}`);
    }
    if (includeMediaUrl && post.mediaUrl && !post.mediaUrl.includes('reddit.com')) {
      lines.push('', `🖼️ *Media:* ${post.mediaUrl}`);
    }
    lines.push('', `🔗 *Link:* ${link}`);
    return lines.join('\n');
  }

  // 2. Discord Formatting (**bold**, *italic*, > blockquote)
  if (platform === 'discord') {
    const lines = [
      `**${title}**`,
      `*by ${author} in ${sub}*`,
      `📊 **Score:** ${score} | 💬 **Comments:** ${comments}`,
    ];
    if (body) {
      lines.push('', `> ${body.replace(/\n/g, '\n> ')}`);
    }
    lines.push('', `🔗 <${link}>`);
    return lines.join('\n');
  }

  // 3. Telegram HTML Formatting (<b>bold</b>, <i>italic</i>, <a>link</a>)
  if (platform === 'telegram' || platform === 'tg') {
    const escapeHtml = (str) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const lines = [
      `<b>${escapeHtml(title)}</b>`,
      `<i>by ${escapeHtml(author)} in ${escapeHtml(sub)}</i>`,
      `📊 <b>Score:</b> ${score} | 💬 <b>Comments:</b> ${comments}`,
    ];
    if (body) {
      lines.push('', `<blockquote>${escapeHtml(body)}</blockquote>`);
    }
    lines.push('', `<a href="${link}">🔗 View on Reddit</a>`);
    return lines.join('\n');
  }

  // 4. Default / Plain text
  const lines = [
    `[${title}]`,
    `by ${author} in ${sub}`,
    `Score: ${score} | Comments: ${comments}`,
  ];
  if (body) lines.push('', body);
  lines.push('', `Link: ${link}`);
  return lines.join('\n');
}

/**
 * Extract direct media attachments (Image, Video, GIF, Gallery) from a post
 */
function extractMedia(post) {
  if (!post) return null;

  const url = post.url || '';
  const mediaUrl = post.mediaUrl || '';

  // 1. Direct image extensions
  if (/\.(jpg|jpeg|png|webp|bmp)$/i.test(url)) {
    return { type: 'image', url, isDirect: true };
  }
  if (/\.(jpg|jpeg|png|webp|bmp)$/i.test(mediaUrl)) {
    return { type: 'image', url: mediaUrl, isDirect: true };
  }

  // 2. Direct GIF / GIFV / MP4
  if (/\.(gif|gifv|mp4)$/i.test(url)) {
    const cleanUrl = url.replace(/\.gifv$/i, '.mp4');
    return { type: 'video', url: cleanUrl, isDirect: true };
  }

  // 3. Reddit Video fallback
  if (post.isVideo || url.includes('v.redd.it')) {
    return {
      type: 'video',
      url: mediaUrl || url,
      isDirect: Boolean(mediaUrl),
      isRedditVideo: true,
    };
  }

  // 4. Imgur / Giphy direct links
  if (url.includes('imgur.com') && !url.includes('.jpg') && !url.includes('.png')) {
    return {
      type: 'image',
      url: `${url}.jpg`,
      isDirect: true,
    };
  }

  // 5. Reddit gallery link
  if (url.includes('reddit.com/gallery/')) {
    return {
      type: 'gallery',
      url,
      isDirect: false,
    };
  }

  // 6. External link or self post
  return {
    type: post.isSelf ? 'text' : 'link',
    url,
    isDirect: false,
  };
}

/**
 * Event-driven Subreddit Watcher for Chatbots
 * Continuously polls a subreddit for new incoming submissions and emits 'post' events.
 */
class SubredditWatcher extends EventEmitter {
  constructor(scraper, { subreddit, intervalMs = 30000, limit = 10 } = {}) {
    super();
    if (!scraper) throw new Error('RedditScraper instance is required');
    if (!subreddit) throw new Error('Subreddit name is required');

    this.scraper = scraper;
    this.subreddit = subreddit.replace(/^r\//, '');
    this.intervalMs = Math.max(intervalMs, 5000); // minimum 5s to avoid aggressive spam
    this.limit = limit;
    this.seenIds = new Set();
    this.timer = null;
    this.isPolling = false;
    this.initialFetchDone = false;
  }

  start() {
    if (this.timer) return this;
    this._poll();
    this.timer = setInterval(() => this._poll(), this.intervalMs);
    return this;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this;
  }

  async _poll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const posts = await this.scraper.getSubredditPosts({
        subreddit: this.subreddit,
        sort: 'new',
        limit: this.limit,
      });

      // On first poll, seed existing posts without emitting flood of events
      if (!this.initialFetchDone) {
        posts.forEach(p => this.seenIds.add(p.id));
        this.initialFetchDone = true;
        this.emit('ready', { subreddit: this.subreddit, initialCount: posts.length });
        this.isPolling = false;
        return;
      }

      // Find truly new posts
      const newPosts = [];
      for (const p of posts) {
        if (!this.seenIds.has(p.id)) {
          this.seenIds.add(p.id);
          newPosts.push(p);
        }
      }

      // Emit oldest first so events fire in chronological order
      for (let i = newPosts.length - 1; i >= 0; i--) {
        this.emit('post', newPosts[i]);
      }

      // Memory cleanup: keep max 1000 seen IDs
      if (this.seenIds.size > 1500) {
        const arr = Array.from(this.seenIds);
        this.seenIds = new Set(arr.slice(arr.length - 1000));
      }
    } catch (err) {
      this.emit('error', err);
    } finally {
      this.isPolling = false;
    }
  }
}

module.exports = {
  formatForBot,
  extractMedia,
  SubredditWatcher,
};
