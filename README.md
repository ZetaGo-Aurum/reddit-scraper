<div align="center">

# 🔥 Reddit Scraper & OSINT Engine

### High-performance, production-grade Reddit Scraper, REST API Microservice & Chatbot Toolkit for Node.js, TypeScript, and CLI.

[![npm version](https://img.shields.io/npm/v/zetago-reddit-scraper.svg?style=for-the-badge&color=FF4500)](https://www.npmjs.com/package/zetago-reddit-scraper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-brightgreen.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Author](https://img.shields.io/badge/Author-ZetaGo--Aurum-blueviolet.svg?style=for-the-badge&logo=github)](https://github.com/ZetaGo-Aurum)

<p align="center">
  <b>Scrape subreddits, deep nested comment trees, user profiles, karma metrics, and search queries with zero friction.</b><br>
  Includes built-in <b>REST API Server</b>, <b>Chatbot Helpers (WhatsApp/Baileys, Discord, Telegram)</b>, <b>Event Watchers</b>, and <b>Instant Mock Testing Mode</b>.
</p>

[Quick Start](#-quick-start) •
[Chatbot Integration](#-chatbot-integration-whatsapp-discord-telegram) •
[REST API Server](#-built-in-rest-api-server) •
[CLI Usage](#-cli-command-line-interface) •
[API Reference](#-programmatic-api-reference) •
[Instant Mock Testing](#-zero-network-mock-testing) •
[Output Examples](#-example-outputs) •
[Authentication Guide](#-reddit-anti-bot--oauth2-guide)

---

</div>

## 🌟 Key Features

- 🔍 **Global & Subreddit Search**: Search posts across all of Reddit or restrict to specific subreddits with filters (relevance, hot, top, new, comments).
- 📜 **Full Subreddit Scraping**: Extract `hot`, `new`, `top`, and `rising` posts with pagination tokens (`after`).
- 🤖 **Chatbot Ready**: Built-in helpers to format posts for **WhatsApp (Baileys)**, **Discord**, and **Telegram** with direct media URL extraction (`extractMedia`, `formatForBot`).
- 📡 **Subreddit Event Stream Watcher**: Event-driven watcher that continuously polls subreddits for incoming new submissions (`watchSubreddit`).
- 🚀 **Zero-Dependency REST API Microservice**: Built-in CORS-enabled micro HTTP server (`createApiServer`, `reddit-scraper serve`).
- 💬 **Deep Comment Tree Parsing**: Recursively extracts nested comment threads with user scores, authors, and timestamps up to arbitrary depth.
- 👤 **User Profile & OSINT**: Fetch user metadata, link/comment karma breakdown, moderator status, submitted posts, and user comments.
- 🧪 **Offline Mock Testing**: Pass `{ mock: true }` or `--mock` for instant testing in CI/CD without hitting Reddit rate limits or needing API keys.
- 🛡️ **Anti-Bot & OAuth2 Support**: Seamless fallback between public `.json` endpoints, browser header impersonation, and official OAuth2 application tokens.
- ⚡ **Zero-Config CLI & NPX**: Run instantly without installing via `npx zetago-reddit-scraper search "AI"`.
- 📦 **Dual Module & TypeScript Native**: Full CommonJS (`require`), ES Modules (`import`), and comprehensive TypeScript typings (`.d.ts`).

---

## 📦 Installation

### Via NPM:
```bash
npm install zetago-reddit-scraper
```

### Global CLI Installation:
```bash
npm install -g zetago-reddit-scraper
```

### Instant Execution with NPX:
```bash
npx zetago-reddit-scraper --help
```

---

## 🚀 Quick Start

### Basic Scraping (ESM or CommonJS)

```javascript
import { RedditScraper } from 'zetago-reddit-scraper';
// Or CommonJS: const { RedditScraper } = require('zetago-reddit-scraper');

const scraper = new RedditScraper();

// 1. Search posts
const posts = await scraper.search({
  query: 'Artificial Intelligence',
  subreddit: 'technology',
  sort: 'top',
  timeFilter: 'week',
  limit: 10,
});

posts.forEach((post) => {
  console.log(`[${post.score} pts] ${post.title} (by u/${post.author})`);
});
```

---

## 🤖 Chatbot Integration (WhatsApp, Discord, Telegram)

`zetago-reddit-scraper` has first-class helpers specifically designed for bots (e.g. WhatsApp with [Aurum-Baileys](https://www.npmjs.com/package/aurum-baileys), Discord.js, Telegraf):

```javascript
import { RedditScraper, formatForBot, extractMedia } from 'zetago-reddit-scraper';

const scraper = new RedditScraper();

// Example: Fetch random meme for "!meme" bot command
const meme = await scraper.getRandomPost('memes');
const media = extractMedia(meme);

// 1. Send to WhatsApp (Baileys)
await sock.sendMessage(jid, {
  image: { url: media.url },
  caption: formatForBot(meme, { platform: 'whatsapp' }),
});

// 2. Send to Discord
channel.send({
  content: formatForBot(meme, { platform: 'discord' }),
  files: media.url ? [media.url] : [],
});

// 3. Send to Telegram
bot.telegram.sendPhoto(chatId, media.url, {
  caption: formatForBot(meme, { platform: 'telegram' }),
  parse_mode: 'HTML',
});
```

### 📡 Live Subreddit Event Watcher
Listen for new posts in real time and automatically forward them to your bot channels:

```javascript
const watcher = scraper.watchSubreddit({
  subreddit: 'technology',
  intervalMs: 15000, // poll every 15s
});

watcher.on('post', (post) => {
  console.log('New post submitted:', post.title);
  // Broadcast to WhatsApp / Telegram group
});

watcher.on('error', (err) => console.error(err.message));

// To stop listening:
// watcher.stop();
```

---

## 📡 Built-In REST API Server

Need an API endpoint for your frontend, mobile app, or webhook? Start a local microservice with **zero external server dependencies** and **CORS enabled**:

### Via Code:
```javascript
import { createApiServer } from 'zetago-reddit-scraper';

const { start } = createApiServer({ port: 3000 });
start(({ port, host }) => console.log(`API running at http://${host}:${port}`));
```

### Via CLI:
```bash
# Live API Server
reddit-scraper serve --port 3000

# Mock API Server (for local frontend/bot offline development)
reddit-scraper serve --port 3000 --mock
```

### Ready-To-Use REST Endpoints:
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Server status and documentation index |
| `/api/search?q=<query>&subreddit=<name>&limit=<num>` | `GET` | Search posts with filtering |
| `/api/r/:subreddit?sort=<hot\|top\|new>&limit=<num>` | `GET` | Fetch subreddit submissions |
| `/api/r/:subreddit/random` | `GET` | Get a random post with parsed media |
| `/api/r/:subreddit/about` | `GET` | Get subreddit rules & subscriber metrics |
| `/api/post/:id?depth=3&limit=50` | `GET` | Fetch post with full comment tree |
| `/api/user/:username?posts=true&comments=true` | `GET` | Fetch user profile, karma, and activity |
| `/api/bot/random?subreddit=memes&platform=whatsapp` | `GET` | Pre-formatted payload ready for bot sending |

---

## 🧪 Zero-Network Mock Testing

Test your bots, CLI tools, and unit tests 100% offline without hitting Reddit rate limits or needing API keys:

```javascript
import { RedditScraper } from 'zetago-reddit-scraper';

// Simply pass { mock: true }
const testScraper = new RedditScraper({ mock: true });

const posts = await testScraper.search({ query: 'offline test' });
console.log(`Received ${posts.length} mock posts instantly!`);
```

Or test in the CLI anytime by adding `--mock`:
```bash
reddit-scraper search "cybersecurity" --mock
reddit-scraper random memes --mock --platform whatsapp
reddit-scraper user ZetaGo-Aurum --mock
```

---

## 💻 CLI (Command Line Interface)

The package ships with the `reddit-scraper` (or `zetago-reddit`) binary:

```bash
reddit-scraper [command] [options]
```

### 1. Search Posts
```bash
# Global search
reddit-scraper search "machine learning" --limit 15 --format table

# Restricted search in a subreddit
reddit-scraper search "quantum computing" -s science --sort top -t month

# Export search results to JSON or CSV
reddit-scraper search "cybersecurity" -f json -o results.json
reddit-scraper search "linux kernel" -f csv -o linux_posts.csv
```

### 2. Random Post & Media (for Chatbots)
```bash
# Get random post formatted for WhatsApp
reddit-scraper random memes --platform whatsapp

# Get direct media URL only
reddit-scraper random anime --media
```

### 3. Live Subreddit Watcher
```bash
reddit-scraper watch technology --interval 15 --platform whatsapp
```

### 4. Start REST API Server
```bash
reddit-scraper serve --port 3000
```

### 5. Subreddit Feeds
```bash
reddit-scraper subreddit programming --limit 20
reddit-scraper about webdev
```

### 6. Post and Comment Tree
```bash
reddit-scraper post 1cv9a01 --depth 3 --limit 50 -f json -o post_tree.json
```

### 7. User Profile OSINT
```bash
reddit-scraper user ZetaGo-Aurum
reddit-scraper user spez --posts --limit 10
```

---

## 📚 Programmatic API Reference

### `new RedditScraper(options?)`

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `search(options)` | `{ query, subreddit?, sort?, timeFilter?, limit?, after? }` | `Promise<Post[]>` | Search posts on Reddit |
| `getSubredditPosts(options)` | `{ subreddit, sort?, timeFilter?, limit?, after? }` | `Promise<Post[]>` | Fetch posts from subreddit feed |
| `getSubredditAbout(subreddit)` | `subreddit: string` | `Promise<SubredditInfo>` | Fetch subreddit rules & subscriber metrics |
| `getRandomPost(subreddit?, sort?)` | `subreddit = 'memes', sort = 'hot'` | `Promise<Post>` | Fetch 1 random post (ideal for bots) |
| `getPost(postIdOrUrl, options?)` | `postIdOrUrl, { sort?, limit?, depth? }` | `Promise<Post>` | Fetch post with complete comment tree |
| `getUserProfile(username)` | `username: string` | `Promise<UserProfile>` | Fetch user profile & karma stats |
| `getUserPosts(username, options?)` | `username, { sort?, limit? }` | `Promise<Post[]>` | Fetch posts submitted by user |
| `getUserComments(username, options?)` | `username, { sort?, limit? }` | `Promise<Comment[]>` | Fetch comments written by user |
| `watchSubreddit(options)` | `{ subreddit, intervalMs?, limit? }` | `SubredditWatcher` | Listen for new posts as EventEmitter |
| `formatForBot(post, options?)` | `post, { platform?, maxTextLength? }` | `string` | Format markdown for WhatsApp/Discord/TG |
| `extractMedia(post)` | `post` | `MediaAttachment` | Get direct image/video/gallery links |
| `export(data, options)` | `data, { format, filePath, title? }` | `string` | Export dataset to JSON, CSV, or MD |

---

## 🛡️ Reddit Anti-Bot & OAuth2 Guide

Reddit frequently responds with **HTTP 403 Forbidden** to datacenter IPs, VPNs, or unauthenticated scrapers.

### Option 1: Free Reddit Script App (Recommended & 100% Reliable)
1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click **"are you a developer? create an app..."** at the bottom.
3. Select **"script"**.
4. Set Name: `my_reddit_scraper` and Redirect URI: `http://localhost:8080`.
5. Copy your **Client ID** (string under the app name) and **Client Secret**.
6. Set in your `.env` or system environment:

```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=nodejs:com.zetagoaurum.reddit-scraper:v1.1.0 (by /u/your_user)
```

The scraper will automatically acquire OAuth2 Bearer tokens and rotate them transparently!

### Option 2: Session Cookie
If you need to scrape private/quarantined subreddits or NSFW feeds without OAuth:
```env
REDDIT_SESSION_COOKIE=your_reddit_session_cookie
```

---

## 📊 Example Outputs

* **[Search Results (JSON)](examples/outputs/search_results.json)**
* **[Subreddit Feed (CSV)](examples/outputs/subreddit_posts.csv)**
* **[Subreddit Markdown Table](examples/outputs/subreddit_posts.md)**
* **[Post with Nested Comments (JSON)](examples/outputs/post_with_comments.json)**
* **[User Profile (JSON)](examples/outputs/user_profile.json)**

---

## 🐍 Python Implementation

A native Python SDK version is also included in the [`python/`](python/) directory:

```bash
cd python
pip install -r requirements.txt
pip install -e .
reddit-scraper-py search "Artificial Intelligence"
```

---

## ⚖️ Watermark, Credits & License

```text
====================================================================
                 REDDIT SCRAPER CORE & CLI ENGINE
====================================================================
 Author      : ZetaGo-Aurum
 GitHub      : https://github.com/ZetaGo-Aurum
 Repository  : https://github.com/ZetaGo-Aurum/reddit-scraper
 License     : MIT

 [NOTICE & WATERMARK]
 DO NOT REMOVE THIS WATERMARK OR AUTHOR CREDITS!
 This software is created and maintained by ZetaGo-Aurum.
 All rights reserved. Unauthorized removal of this header is prohibited.
====================================================================
```

Released under the [MIT License](LICENSE).  
Copyright (c) 2024-2026 **ZetaGo-Aurum**.
