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

/**
 * Reddit Comment Model
 */
class Comment {
  constructor(data = {}, depth = 0) {
    this.id = data.id || '';
    this.author = data.author || '[deleted]';
    this.body = data.body || '';
    this.score = typeof data.score === 'number' ? data.score : 0;
    this.createdUtc = data.created_utc || 0;
    this.permalink = data.permalink ? (data.permalink.startsWith('http') ? data.permalink : `https://www.reddit.com${data.permalink}`) : '';
    this.parentId = data.parent_id || '';
    this.depth = depth;
    this.replies = Array.isArray(data.replies) ? data.replies : [];
  }

  get createdAt() {
    return this.createdUtc ? new Date(this.createdUtc * 1000).toISOString() : null;
  }

  static fromRedditJson(raw, depth = 0) {
    if (!raw || raw.kind !== 't1') return null;
    const cdata = raw.data || {};
    
    let parsedReplies = [];
    if (cdata.replies && typeof cdata.replies === 'object' && cdata.replies.data) {
      const children = cdata.replies.data.children || [];
      for (const child of children) {
        const parsedChild = Comment.fromRedditJson(child, depth + 1);
        if (parsedChild) parsedReplies.push(parsedChild);
      }
    }

    return new Comment({
      id: cdata.id,
      author: cdata.author,
      body: cdata.body,
      score: cdata.score,
      created_utc: cdata.created_utc,
      permalink: cdata.permalink,
      parent_id: cdata.parent_id,
      replies: parsedReplies,
    }, depth);
  }

  toJSON() {
    return {
      id: this.id,
      author: this.author,
      body: this.body,
      score: this.score,
      createdUtc: this.createdUtc,
      createdAt: this.createdAt,
      permalink: this.permalink,
      parentId: this.parentId,
      depth: this.depth,
      replies: this.replies.map(r => r.toJSON ? r.toJSON() : r),
    };
  }
}

/**
 * Reddit Post / Submission Model
 */
class Post {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.author = data.author || '[deleted]';
    this.subreddit = data.subreddit || '';
    this.score = typeof data.score === 'number' ? data.score : 0;
    this.upvoteRatio = typeof data.upvote_ratio === 'number' ? data.upvote_ratio : null;
    this.numComments = typeof data.num_comments === 'number' ? data.num_comments : 0;
    this.createdUtc = data.created_utc || 0;
    this.url = data.url || '';
    this.permalink = data.permalink ? (data.permalink.startsWith('http') ? data.permalink : `https://www.reddit.com${data.permalink}`) : '';
    this.selftext = data.selftext || '';
    this.isSelf = Boolean(data.is_self);
    this.isVideo = Boolean(data.is_video);
    this.over18 = Boolean(data.over_18);
    this.linkFlairText = data.link_flair_text || null;
    this.mediaUrl = data.media_url || null;
    this.comments = Array.isArray(data.comments) ? data.comments : [];
  }

  get createdAt() {
    return this.createdUtc ? new Date(this.createdUtc * 1000).toISOString() : null;
  }

  static fromRedditJson(raw) {
    if (!raw) return null;
    const pdata = raw.data || raw;

    let mediaUrl = null;
    if (pdata.is_video && pdata.media && pdata.media.reddit_video) {
      mediaUrl = pdata.media.reddit_video.fallback_url;
    } else if (!pdata.is_self && pdata.url) {
      mediaUrl = pdata.url;
    }

    return new Post({
      id: pdata.id,
      title: pdata.title,
      author: pdata.author,
      subreddit: pdata.subreddit,
      score: pdata.score,
      upvote_ratio: pdata.upvote_ratio,
      num_comments: pdata.num_comments,
      created_utc: pdata.created_utc,
      url: pdata.url,
      permalink: pdata.permalink,
      selftext: pdata.selftext,
      is_self: pdata.is_self,
      is_video: pdata.is_video,
      over_18: pdata.over_18,
      link_flair_text: pdata.link_flair_text,
      media_url: mediaUrl,
    });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      subreddit: this.subreddit,
      score: this.score,
      upvoteRatio: this.upvoteRatio,
      numComments: this.numComments,
      createdUtc: this.createdUtc,
      createdAt: this.createdAt,
      url: this.url,
      permalink: this.permalink,
      selftext: this.selftext,
      isSelf: this.isSelf,
      isVideo: this.isVideo,
      over18: this.over18,
      linkFlairText: this.linkFlairText,
      mediaUrl: this.mediaUrl,
      comments: this.comments.map(c => c.toJSON ? c.toJSON() : c),
    };
  }
}

/**
 * Subreddit Information Model
 */
class SubredditInfo {
  constructor(data = {}) {
    this.name = data.name || '';
    this.displayName = data.display_name || '';
    this.title = data.title || '';
    this.publicDescription = data.public_description || '';
    this.description = data.description || '';
    this.subscribers = typeof data.subscribers === 'number' ? data.subscribers : 0;
    this.activeUserCount = typeof data.active_user_count === 'number' ? data.active_user_count : null;
    this.createdUtc = data.created_utc || 0;
    this.over18 = Boolean(data.over18);
    this.url = data.url ? (data.url.startsWith('http') ? data.url : `https://www.reddit.com${data.url}`) : `https://www.reddit.com/r/${this.displayName}/`;
  }

  get createdAt() {
    return this.createdUtc ? new Date(this.createdUtc * 1000).toISOString() : null;
  }

  static fromRedditJson(raw) {
    if (!raw) return null;
    const sdata = raw.data || raw;
    return new SubredditInfo({
      name: sdata.name,
      display_name: sdata.display_name,
      title: sdata.title,
      public_description: sdata.public_description,
      description: sdata.description,
      subscribers: sdata.subscribers,
      active_user_count: sdata.active_user_count,
      created_utc: sdata.created_utc,
      over18: sdata.over18,
      url: sdata.url,
    });
  }

  toJSON() {
    return {
      name: this.name,
      displayName: this.displayName,
      title: this.title,
      publicDescription: this.publicDescription,
      description: this.description,
      subscribers: this.subscribers,
      activeUserCount: this.activeUserCount,
      createdUtc: this.createdUtc,
      createdAt: this.createdAt,
      over18: this.over18,
      url: this.url,
    };
  }
}

/**
 * User Profile Model
 */
class UserProfile {
  constructor(data = {}) {
    this.username = data.username || '';
    this.id = data.id || '';
    this.createdUtc = data.created_utc || 0;
    this.linkKarma = typeof data.link_karma === 'number' ? data.link_karma : 0;
    this.commentKarma = typeof data.comment_karma === 'number' ? data.comment_karma : 0;
    this.totalKarma = typeof data.total_karma === 'number' ? data.total_karma : (this.linkKarma + this.commentKarma);
    this.isGold = Boolean(data.is_gold);
    this.isMod = Boolean(data.is_mod);
    this.hasVerifiedEmail = typeof data.has_verified_email === 'boolean' ? data.has_verified_email : null;
    this.bio = data.bio || '';
    this.iconImg = data.icon_img || null;
    this.profileUrl = `https://www.reddit.com/user/${this.username}`;
  }

  get createdAt() {
    return this.createdUtc ? new Date(this.createdUtc * 1000).toISOString() : null;
  }

  static fromRedditJson(raw) {
    if (!raw) return null;
    const udata = raw.data || raw;
    const sub = udata.subreddit || {};
    const linkK = udata.link_karma || 0;
    const commK = udata.comment_karma || 0;
    const totalK = udata.total_karma || (linkK + commK);

    return new UserProfile({
      username: udata.name,
      id: udata.id,
      created_utc: udata.created_utc,
      link_karma: linkK,
      comment_karma: commK,
      total_karma: totalK,
      is_gold: udata.is_gold,
      is_mod: udata.is_mod,
      has_verified_email: udata.has_verified_email,
      bio: sub.public_description || '',
      icon_img: udata.icon_img,
    });
  }

  toJSON() {
    return {
      username: this.username,
      id: this.id,
      createdUtc: this.createdUtc,
      createdAt: this.createdAt,
      linkKarma: this.linkKarma,
      commentKarma: this.commentKarma,
      totalKarma: this.totalKarma,
      isGold: this.isGold,
      isMod: this.isMod,
      hasVerifiedEmail: this.hasVerifiedEmail,
      bio: this.bio,
      iconImg: this.iconImg,
      profileUrl: this.profileUrl,
    };
  }
}

module.exports = {
  Comment,
  Post,
  SubredditInfo,
  UserProfile,
};
