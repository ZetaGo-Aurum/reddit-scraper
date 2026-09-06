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

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const {
  RedditScraper,
  RedditClient,
  Post,
  Comment,
  SubredditInfo,
  UserProfile,
  exportToJson,
  exportToCsv,
  exportToMarkdown,
  formatForBot,
  extractMedia,
  extractRawMedia,
  isFfmpegAvailable,
  createApiServer,
} = require('../lib');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${desc}`);
    console.error(`    ${err.message}`);
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  \x1b[32m✔\x1b[0m ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${desc}`);
    console.error(`    ${err.message}`);
  }
}

async function main() {
  console.log('\n========================================================');
  console.log('       RUNNING REDDIT SCRAPER UNIT TEST SUITE');
  console.log('       Author: ZetaGo-Aurum (c) All Rights Reserved');
  console.log('========================================================\n');

  // 1. Models Test
  it('should properly instantiate and parse Post model', () => {
    const mockPostData = {
      kind: 't3',
      data: {
        id: 'test1234',
        title: 'Amazing Open Source AI Project',
        author: 'zetagoaurum',
        subreddit: 'opensource',
        score: 1337,
        upvote_ratio: 0.98,
        num_comments: 42,
        created_utc: 1714500000,
        url: 'https://reddit.com/r/opensource/comments/test1234',
        permalink: '/r/opensource/comments/test1234/amazing_ai',
        selftext: 'This is a test selftext post content.',
        is_self: true,
        is_video: false,
        over_18: false,
        link_flair_text: 'Showcase',
      },
    };

    const post = Post.fromRedditJson(mockPostData);
    assert.strictEqual(post.id, 'test1234');
    assert.strictEqual(post.title, 'Amazing Open Source AI Project');
    assert.strictEqual(post.score, 1337);
    assert.strictEqual(post.isSelf, true);
    assert.strictEqual(post.linkFlairText, 'Showcase');
    assert.ok(post.createdAt.includes('2024'));

    const json = post.toJSON();
    assert.strictEqual(json.id, 'test1234');
  });

  it('should properly instantiate and parse Comment model with nested replies', () => {
    const mockComment = {
      kind: 't1',
      data: {
        id: 'c1',
        author: 'coder_pro',
        body: 'Top level comment',
        score: 25,
        created_utc: 1714501000,
        permalink: '/r/opensource/comments/test1234/comment/c1',
        parent_id: 't3_test1234',
        replies: {
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'c2',
                  author: 'reviewer',
                  body: 'Nested reply here',
                  score: 5,
                  created_utc: 1714502000,
                  parent_id: 't1_c1',
                },
              },
            ],
          },
        },
      },
    };

    const comment = Comment.fromRedditJson(mockComment);
    assert.strictEqual(comment.id, 'c1');
    assert.strictEqual(comment.replies.length, 1);
    assert.strictEqual(comment.replies[0].id, 'c2');
    assert.strictEqual(comment.replies[0].depth, 1);
    assert.strictEqual(comment.replies[0].body, 'Nested reply here');
  });

  it('should properly instantiate and parse SubredditInfo model', () => {
    const mockSub = {
      kind: 't5',
      data: {
        name: 't5_2qi04',
        display_name: 'programming',
        title: 'Programming Discussion',
        public_description: 'Computer Programming community',
        subscribers: 5600000,
        active_user_count: 1400,
        created_utc: 1168000000,
        over18: false,
        url: '/r/programming/',
      },
    };

    const sub = SubredditInfo.fromRedditJson(mockSub);
    assert.strictEqual(sub.displayName, 'programming');
    assert.strictEqual(sub.subscribers, 5600000);
    assert.strictEqual(sub.over18, false);
    assert.ok(sub.url.includes('programming'));
  });

  it('should properly instantiate and parse UserProfile model', () => {
    const mockUser = {
      kind: 't2',
      data: {
        name: 'zetagoaurum',
        id: 'usr_9988',
        created_utc: 1700000000,
        link_karma: 15420,
        comment_karma: 8900,
        is_gold: true,
        is_mod: true,
        has_verified_email: true,
        subreddit: {
          public_description: 'AI & Reverse Engineering Researcher',
        },
      },
    };

    const user = UserProfile.fromRedditJson(mockUser);
    assert.strictEqual(user.username, 'zetagoaurum');
    assert.strictEqual(user.totalKarma, 15420 + 8900);
    assert.strictEqual(user.isGold, true);
    assert.strictEqual(user.bio, 'AI & Reverse Engineering Researcher');
  });

  // 2. Mock Client & Scraper Operations
  class MockRedditClient extends RedditClient {
    async get(path, params) {
      if (path.includes('/search')) {
        return {
          data: {
            children: [
              {
                kind: 't3',
                data: {
                  id: 'search_post_1',
                  title: `Result for query ${params.q}`,
                  author: 'tester',
                  subreddit: params.restrict_sr ? 'custom_sub' : 'all',
                  score: 100,
                  created_utc: 1714500000,
                },
              },
            ],
          },
        };
      }

      if (path.includes('/about')) {
        if (path.includes('/user/')) {
          return {
            data: {
              name: 'target_user',
              id: 'u123',
              link_karma: 500,
              comment_karma: 200,
            },
          };
        }
        return {
          data: {
            display_name: 'test_sub',
            title: 'Test Subreddit',
            subscribers: 12345,
          },
        };
      }

      if (path.includes('/comments/')) {
        return [
          {
            data: {
              children: [
                {
                  kind: 't3',
                  data: {
                    id: 'post_abc',
                    title: 'A deeply commented post',
                    author: 'op',
                    subreddit: 'test',
                    score: 50,
                  },
                },
              ],
            },
          },
          {
            data: {
              children: [
                {
                  kind: 't1',
                  data: {
                    id: 'comm_1',
                    author: 'user1',
                    body: 'First great comment',
                    score: 10,
                  },
                },
              ],
            },
          },
        ];
      }

      return {
        data: {
          children: [
            {
              kind: 't3',
              data: {
                id: 'p1',
                title: 'Subreddit Post 1',
                author: 'author1',
                subreddit: 'news',
                score: 999,
              },
            },
          ],
        },
      };
    }
  }

  const mockClient = new MockRedditClient();
  const scraper = new RedditScraper(mockClient);

  await itAsync('should search posts successfully', async () => {
    const results = await scraper.search({ query: 'machine learning', limit: 5 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'search_post_1');
    assert.ok(results[0].title.includes('machine learning'));
  });

  await itAsync('should get subreddit posts', async () => {
    const posts = await scraper.getSubredditPosts({ subreddit: 'news', limit: 5 });
    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts[0].id, 'p1');
    assert.strictEqual(posts[0].subreddit, 'news');
  });

  await itAsync('should get subreddit metadata', async () => {
    const info = await scraper.getSubredditAbout('test_sub');
    assert.strictEqual(info.displayName, 'test_sub');
    assert.strictEqual(info.subscribers, 12345);
  });

  await itAsync('should get post with comment tree', async () => {
    const post = await scraper.getPost('post_abc');
    assert.strictEqual(post.id, 'post_abc');
    assert.strictEqual(post.comments.length, 1);
    assert.strictEqual(post.comments[0].body, 'First great comment');
  });

  await itAsync('should get user profile', async () => {
    const user = await scraper.getUserProfile('target_user');
    assert.strictEqual(user.username, 'target_user');
    assert.strictEqual(user.totalKarma, 700);
  });

  // 3. Export Utilities Test
  it('should export scraped data to JSON, CSV, and Markdown', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reddit-test-'));
    const testPost = new Post({
      id: 'p_export',
      title: 'Export Test Post',
      author: 'exporter',
      subreddit: 'test',
      score: 42,
    });

    const jsonPath = path.join(tmpDir, 'test.json');
    exportToJson([testPost], jsonPath);
    assert.ok(fs.existsSync(jsonPath));
    const jsonParsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    assert.strictEqual(jsonParsed[0].id, 'p_export');

    const csvPath = path.join(tmpDir, 'test.csv');
    exportToCsv([testPost], csvPath);
    assert.ok(fs.existsSync(csvPath));
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    assert.ok(csvContent.includes('"Export Test Post"'));

    const mdPath = path.join(tmpDir, 'test.md');
    exportToMarkdown([testPost], mdPath, 'Test Export');
    assert.ok(fs.existsSync(mdPath));
    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    assert.ok(mdContent.includes('### 1. [Export Test Post]'));

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // 4. Test Mock Mode, Bot Helpers, and REST API Server
  const offlineScraper = new RedditScraper({ mock: true });

  await itAsync('should support mock mode for instant offline testing', async () => {
    const posts = await offlineScraper.search({ query: 'offline' });
    assert.ok(posts.length > 0);
    const rand = await offlineScraper.getRandomPost('memes');
    assert.ok(rand.id);
    const user = await offlineScraper.getUserProfile('ZetaGo-Aurum');
    assert.strictEqual(user.username, 'ZetaGo-Aurum');
  });

  it('should format posts appropriately for WhatsApp, Discord, and Telegram bots', () => {
    const p = new Post({
      id: 'p_bot',
      title: 'Bot Integration Title',
      author: 'dev',
      subreddit: 'bots',
      score: 500,
      num_comments: 30,
      permalink: 'https://reddit.com/r/bots/p_bot',
      selftext: 'Hello bot world',
    });

    const wa = formatForBot(p, { platform: 'whatsapp' });
    assert.ok(wa.includes('*Bot Integration Title*'));
    assert.ok(wa.includes('*r/bots*'));

    const discord = formatForBot(p, { platform: 'discord' });
    assert.ok(discord.includes('**Bot Integration Title**'));

    const tg = formatForBot(p, { platform: 'telegram' });
    assert.ok(tg.includes('<b>Bot Integration Title</b>'));
  });

  it('should accurately extract image and video media URLs', () => {
    const imgPost = new Post({ id: 'img1', url: 'https://i.redd.it/test.png' });
    const imgMedia = extractMedia(imgPost);
    assert.strictEqual(imgMedia.type, 'image');
    assert.strictEqual(imgMedia.isDirect, true);

    const vidPost = new Post({
      id: 'vid1',
      url: 'https://v.redd.it/1234',
      is_video: true,
      media_url: 'https://v.redd.it/1234/DASH_720.mp4',
    });
    const vidMedia = extractMedia(vidPost);
    assert.strictEqual(vidMedia.type, 'video');
  });

  await itAsync('should initialize and serve requests via built-in REST API server', async () => {
    const { server, start } = createApiServer({ port: 3099, mock: true });

    await new Promise((resolve, reject) => {
      start(({ port }) => {
        http.get(`http://localhost:${port}/health`, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            const data = JSON.parse(body);
            assert.strictEqual(data.status, true);
            assert.strictEqual(data.service, 'ZetaGo Reddit Scraper REST API');
            server.close(resolve);
          });
        }).on('error', (err) => {
          server.close();
          reject(err);
        });
      });
    });
  });


  // 5. Test Raw Media Extraction & FFmpeg Detector
  it('should extract raw media from Reddit video with separate audio stream', () => {
    const videoPost = {
      id: 'vid123',
      title: 'Awesome Clip',
      is_video: true,
      media: {
        reddit_video: {
          fallback_url: 'https://v.redd.it/xyz123/DASH_1080.mp4?source=fallback',
          hls_url: 'https://v.redd.it/xyz123/HLSPlaylist.m3u8',
          width: 1920,
          height: 1080,
          duration: 25,
          is_gif: false,
        },
      },
    };

    const media = extractRawMedia(videoPost);
    assert.strictEqual(media.mediaType, 'video');
    assert.strictEqual(media.hasAudio, true);
    assert.strictEqual(media.files.length, 2); // video + audio
    assert.strictEqual(media.files[0].type, 'video');
    assert.strictEqual(media.files[1].type, 'audio');
    assert.ok(media.files[1].url.includes('DASH_audio.mp4'));
  });

  it('should extract all full-resolution photos from Reddit Gallery albums', () => {
    const galleryPost = {
      id: 'gal123',
      title: 'Trip to Tokyo',
      gallery_data: {
        items: [{ media_id: 'img_a' }, { media_id: 'img_b' }],
      },
      media_metadata: {
        img_a: { s: { u: 'https://preview.redd.it/img_a.jpg?width=1080&amp;crop=smart', x: 1080, y: 1920 } },
        img_b: { s: { u: 'https://preview.redd.it/img_b.jpg?width=1080&amp;crop=smart', x: 1080, y: 1920 } },
      },
    };

    const media = extractRawMedia(galleryPost);
    assert.strictEqual(media.mediaType, 'gallery');
    assert.strictEqual(media.files.length, 2);
    assert.strictEqual(media.files[0].url, 'https://i.redd.it/img_a.jpg');
    assert.strictEqual(media.files[1].url, 'https://i.redd.it/img_b.jpg');
  });

  await itAsync('should detect host FFmpeg availability', async () => {
    const available = await isFfmpegAvailable();
    assert.strictEqual(typeof available, 'boolean');
  });

  console.log('\n--------------------------------------------------------');
  console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
  if (passedTests === totalTests) {
    console.log('\x1b[32m✔ ALL 17 UNIT TESTS PASSED PERFECTLY!\x1b[0m\n');
  } else {
    console.error('\x1b[31m✖ SOME TESTS FAILED!\x1b[0m\n');
    process.exit(1);
  }
}

main();
