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

const http = require('http');
const { RedditScraper } = require('./scraper');
const { formatForBot, extractMedia } = require('./bot');
const pkg = require('../package.json');

/**
 * Create lightweight zero-dependency REST API server
 */
function createApiServer(options = {}) {
  const port = options.port || 3000;
  const host = options.host || '0.0.0.0';
  const scraper = options.scraper || new RedditScraper({ mock: Boolean(options.mock) });

  const sendJson = (res, statusCode, data) => {
    const payload = JSON.stringify(data, null, 2);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Powered-By': `ZetaGo-Reddit-Scraper/${pkg.version}`,
    });
    res.end(payload);
  };

  const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    if (req.method !== 'GET') {
      return sendJson(res, 405, {
        status: false,
        error: 'Method Not Allowed. Only GET requests are supported.',
      });
    }

    const hostHeader = req.headers.host || `localhost:${port}`;
    const parsedUrl = new URL(req.url, `http://${hostHeader}`);
    const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';
    const params = parsedUrl.searchParams;

    try {
      // 1. Root / Health Check
      if (pathname === '/' || pathname === '/health' || pathname === '/api') {
        return sendJson(res, 200, {
          status: true,
          service: 'ZetaGo Reddit Scraper REST API',
          version: pkg.version,
          author: 'ZetaGo-Aurum',
          github: 'https://github.com/ZetaGo-Aurum/reddit-scraper',
          endpoints: {
            search: '/api/search?q=<query>&subreddit=<subr>&sort=<sort>&limit=<num>',
            subreddit: '/api/r/:subreddit?sort=<hot|top|new>&limit=<num>',
            random: '/api/r/:subreddit/random',
            about: '/api/r/:subreddit/about',
            post: '/api/post/:id?depth=<num>&limit=<num>',
            user: '/api/user/:username?posts=true&comments=true',
            botRandom: '/api/bot/random?subreddit=<name>&platform=<whatsapp|discord|telegram>',
          },
        });
      }

      // 2. Search Endpoint: /api/search?q=...
      if (pathname === '/api/search') {
        const q = params.get('q');
        if (!q) {
          return sendJson(res, 400, { status: false, error: 'Missing required query parameter "q".' });
        }
        const posts = await scraper.search({
          query: q,
          subreddit: params.get('subreddit') || null,
          sort: params.get('sort') || 'relevance',
          timeFilter: params.get('time') || params.get('t') || 'all',
          limit: parseInt(params.get('limit'), 10) || 25,
        });
        return sendJson(res, 200, {
          status: true,
          count: posts.length,
          data: posts.map((p) => p.toJSON()),
        });
      }

      // 3. Bot Random Media Endpoint: /api/bot/random?subreddit=...
      if (pathname === '/api/bot/random') {
        const subreddit = params.get('subreddit') || 'memes';
        const platform = params.get('platform') || 'whatsapp';
        const post = await scraper.getRandomPost(subreddit);
        const media = extractMedia(post);
        const botText = formatForBot(post, { platform });

        return sendJson(res, 200, {
          status: true,
          platform,
          formattedText: botText,
          media,
          post: post.toJSON(),
        });
      }

      // 4. Subreddit About: /api/r/:subreddit/about
      const aboutMatch = pathname.match(/^\/api\/r\/([a-zA-Z0-9_]+)\/about$/);
      if (aboutMatch) {
        const subreddit = aboutMatch[1];
        const info = await scraper.getSubredditAbout(subreddit);
        return sendJson(res, 200, { status: true, data: info.toJSON() });
      }

      // 5. Subreddit Random: /api/r/:subreddit/random
      const randomMatch = pathname.match(/^\/api\/r\/([a-zA-Z0-9_]+)\/random$/);
      if (randomMatch) {
        const subreddit = randomMatch[1];
        const post = await scraper.getRandomPost(subreddit);
        const media = extractMedia(post);
        return sendJson(res, 200, {
          status: true,
          media,
          data: post.toJSON(),
        });
      }

      // 6. Subreddit Posts: /api/r/:subreddit
      const subMatch = pathname.match(/^\/api\/r\/([a-zA-Z0-9_]+)$/);
      if (subMatch) {
        const subreddit = subMatch[1];
        const posts = await scraper.getSubredditPosts({
          subreddit,
          sort: params.get('sort') || 'hot',
          timeFilter: params.get('time') || params.get('t') || 'all',
          limit: parseInt(params.get('limit'), 10) || 25,
        });
        return sendJson(res, 200, {
          status: true,
          subreddit,
          count: posts.length,
          data: posts.map((p) => p.toJSON()),
        });
      }

      // 7. Post with Comments: /api/post/:id
      const postMatch = pathname.match(/^\/api\/post\/([a-zA-Z0-9_]+)$/);
      if (postMatch) {
        const postId = postMatch[1];
        const post = await scraper.getPost(postId, {
          depth: parseInt(params.get('depth'), 10) || 3,
          limit: parseInt(params.get('limit'), 10) || 50,
        });
        return sendJson(res, 200, { status: true, data: post.toJSON() });
      }

      // 8. User Profile: /api/user/:username
      const userMatch = pathname.match(/^\/api\/user\/([a-zA-Z0-9_-]+)$/);
      if (userMatch) {
        const username = userMatch[1];
        const profile = await scraper.getUserProfile(username);
        const result = { status: true, profile: profile.toJSON() };

        if (params.get('posts') === 'true') {
          const posts = await scraper.getUserPosts(username, { limit: parseInt(params.get('limit'), 10) || 10 });
          result.posts = posts.map(p => p.toJSON());
        }
        if (params.get('comments') === 'true') {
          const comments = await scraper.getUserComments(username, { limit: parseInt(params.get('limit'), 10) || 10 });
          result.comments = comments.map(c => c.toJSON());
        }

        return sendJson(res, 200, result);
      }

      // 404 Route Not Found
      return sendJson(res, 404, {
        status: false,
        error: `Endpoint "${pathname}" not found. Visit / for API documentation.`,
      });
    } catch (err) {
      return sendJson(res, 500, {
        status: false,
        error: err.message || 'Internal Server Error',
      });
    }
  });

  const start = (cb) => {
    server.listen(port, host, () => {
      if (cb) cb({ port, host });
    });
    return server;
  };

  return {
    server,
    start,
  };
}

module.exports = {
  createApiServer,
};
