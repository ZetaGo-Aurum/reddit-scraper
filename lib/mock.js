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

const { Post, Comment, SubredditInfo, UserProfile } = require('./models');

function getMockPosts(count = 5, subreddit = 'programming', query = null) {
  const posts = [];
  const titles = [
    'Building Fast REST & Bot Microservices in Node.js',
    'Open Source Deep-Reasoning Agent Toolkit Released',
    'How Modern Scraping Bypasses Cloudflare & Bot Challenges',
    'Interactive WhatsApp & Discord Bots Architecture in 2026',
    'Zero-Dependency Micro HTTP Servers vs Express Benchmark',
    'Scaling Subreddit Event Stream Watchers without Memory Leaks',
  ];

  for (let i = 0; i < count; i++) {
    const id = `mock_${Math.random().toString(36).substring(2, 9)}`;
    const baseTitle = titles[i % titles.length];
    const title = query ? `[${query}] ${baseTitle}` : baseTitle;

    posts.push(
      new Post({
        id,
        title,
        author: `bot_dev_${i + 1}`,
        subreddit,
        score: Math.floor(Math.random() * 4000) + 150,
        upvote_ratio: 0.95,
        num_comments: Math.floor(Math.random() * 300) + 20,
        created_utc: Math.floor(Date.now() / 1000) - i * 3600,
        url: `https://i.redd.it/${id}.jpg`,
        permalink: `/r/${subreddit}/comments/${id}/mock_post/`,
        selftext: `This is mock post content for #${i + 1}. Ideal for unit testing and bot offline development without API rate-limits.`,
        is_self: i % 2 === 0,
        is_video: false,
        over_18: false,
        media_url: i % 2 !== 0 ? `https://i.redd.it/${id}.jpg` : null,
      })
    );
  }
  return posts;
}

function getMockPostWithComments(id = 'mock_thread') {
  const post = new Post({
    id,
    title: 'Testing Nested Reddit Thread with Mock Engine',
    author: 'ZetaGo-Aurum',
    subreddit: 'node',
    score: 1280,
    upvote_ratio: 0.98,
    num_comments: 14,
    created_utc: Math.floor(Date.now() / 1000) - 7200,
    url: 'https://github.com/ZetaGo-Aurum/reddit-scraper',
    permalink: `/r/node/comments/${id}/test_thread/`,
    selftext: 'Mock thread content for offline testing of comment trees and bot reply parsers.',
    is_self: true,
  });

  const comment1 = new Comment({
    id: 'mock_c1',
    author: 'bot_enthusiast',
    body: 'Is this mock mode compatible with Telegram and WhatsApp bots?',
    score: 45,
    created_utc: Math.floor(Date.now() / 1000) - 3600,
    permalink: `/r/node/comments/${id}/test_thread/mock_c1/`,
    parent_id: `t3_${id}`,
    depth: 0,
    replies: [
      new Comment({
        id: 'mock_c2',
        author: 'ZetaGo-Aurum',
        body: 'Yes! You can test bot formatting and handlers 100% offline without hitting Reddit rate limits.',
        score: 30,
        created_utc: Math.floor(Date.now() / 1000) - 1800,
        permalink: `/r/node/comments/${id}/test_thread/mock_c2/`,
        parent_id: 't1_mock_c1',
        depth: 1,
      }),
    ],
  });

  post.comments = [comment1];
  return post;
}

function getMockSubredditInfo(subreddit = 'programming') {
  return new SubredditInfo({
    name: `t5_${subreddit}`,
    display_name: subreddit,
    title: `${subreddit.toUpperCase()} Community & Discussions`,
    public_description: `Official mock community for ${subreddit}.`,
    description: `Detailed description for testing r/${subreddit} about metadata.`,
    subscribers: 2500000,
    active_user_count: 3400,
    created_utc: 1200000000,
    over18: false,
    url: `https://www.reddit.com/r/${subreddit}/`,
  });
}

function getMockUserProfile(username = 'ZetaGo-Aurum') {
  return new UserProfile({
    username,
    id: 'usr_mock123',
    created_utc: 1729053347,
    link_karma: 42000,
    comment_karma: 21500,
    total_karma: 63500,
    is_gold: true,
    is_mod: true,
    has_verified_email: true,
    bio: 'AI Engineer & Bot Developer. Creator of ZetaGo-Aurum ecosystem.',
    icon_img: 'https://avatars.githubusercontent.com/u/185160235?v=4',
  });
}

module.exports = {
  getMockPosts,
  getMockPostWithComments,
  getMockSubredditInfo,
  getMockUserProfile,
};
