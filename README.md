<div align="center">

# 🔥 Reddit Scraper & OSINT Engine

### High-performance, production-grade Reddit Scraper & OSINT Toolkit for Node.js, TypeScript, and CLI.

[![npm version](https://img.shields.io/npm/v/@zetagoaurum-dev/reddit-scraper.svg?style=for-the-badge&color=FF4500)](https://www.npmjs.com/package/@zetagoaurum-dev/reddit-scraper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-brightgreen.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Author](https://img.shields.io/badge/Author-ZetaGo--Aurum-blueviolet.svg?style=for-the-badge&logo=github)](https://github.com/ZetaGo-Aurum)

<p align="center">
  <b>Scrape subreddits, deep nested comment trees, user profiles, karma metrics, and search queries with zero friction.</b><br>
  Includes resilient HTTP client, OAuth2 credentials support, session cookie rotation, and export to JSON/CSV/Markdown.
</p>

[Quick Start](#-quick-start) •
[CLI Usage](#-cli-command-line-interface) •
[API Reference](#-programmatic-api-reference) •
[Output Examples](#-example-outputs) •
[Authentication Guide](#-reddit-anti-bot--oauth2-guide) •
[Python Engine](#-python-implementation)

---

</div>

## 🌟 Key Features

- 🔍 **Global & Subreddit Search**: Search posts across all of Reddit or restrict to specific subreddits with filters (relevance, hot, top, new, comments).
- 📜 **Full Subreddit Scraping**: Extract `hot`, `new`, `top`, and `rising` posts with pagination tokens (`after`).
- 💬 **Deep Comment Tree Parsing**: Recursively extracts nested comment threads with user scores, authors, and timestamps up to arbitrary depth.
- 👤 **User Profile & OSINT**: Fetch user metadata, link/comment karma breakdown, moderator status, submitted posts, and user comments.
- 🛡️ **Anti-Bot & OAuth2 Support**: Seamless fallback between public `.json` endpoints, browser header impersonation, and official OAuth2 application tokens.
- ⚡ **Zero-Config CLI & NPX**: Run instantly without installing via `npx @zetagoaurum-dev/reddit-scraper search "AI"`.
- 📦 **Dual Module & TypeScript Native**: Full CommonJS (`require`), ES Modules (`import`), and comprehensive TypeScript typings (`.d.ts`).
- 📊 **Multi-Format Data Exporter**: Export scraped feeds directly to formatted **JSON**, **CSV**, or formatted **Markdown** tables.

---

## 📦 Installation

### Via NPM:
```bash
npm install @zetagoaurum-dev/reddit-scraper
```

### Global CLI Installation:
```bash
npm install -g @zetagoaurum-dev/reddit-scraper
```

### Instant Execution with NPX:
```bash
npx @zetagoaurum-dev/reddit-scraper --help
```

---

## 🚀 Quick Start

### JavaScript (ESM or CommonJS)

```javascript
import { RedditScraper } from '@zetagoaurum-dev/reddit-scraper';
// Or CommonJS: const { RedditScraper } = require('@zetagoaurum-dev/reddit-scraper');

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

### TypeScript

```typescript
import { RedditScraper, Post, Comment } from '@zetagoaurum-dev/reddit-scraper';

const scraper = new RedditScraper();
const post: Post = await scraper.getPost('1cv9a01', { depth: 3, limit: 50 });

console.log(`Title: ${post.title}`);
console.log(`Comments count: ${post.comments.length}`);
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

### 2. Scrape Subreddit Feeds
```bash
# Scrape Hot posts
reddit-scraper subreddit programming --limit 20

# Scrape Top posts of the year
reddit-scraper sub technology --sort top --time year --limit 50 -f table
```

### 3. Subreddit Metadata & Metrics
```bash
reddit-scraper about webdev
```

### 4. Scrape Post and Nested Comment Tree
```bash
# Using post ID
reddit-scraper post 1cv9a01 --depth 3 --limit 50 -f json -o post_tree.json

# Using full Reddit URL
reddit-scraper post "https://www.reddit.com/r/programming/comments/1cv9a01/example/"
```

### 5. Scrape User Profile & Activity
```bash
# Fetch user karma & bio
reddit-scraper user ZetaGo-Aurum

# Fetch recent posts submitted by user
reddit-scraper user spez --posts --limit 10

# Fetch recent comments made by user
reddit-scraper user spez --comments --limit 15
```

### 6. Interactive Credentials Setup
```bash
reddit-scraper config --set-client-id <ID> --set-client-secret <SECRET>
```

---

## 📚 Programmatic API Reference

### `new RedditScraper(clientOrConfig?)`
Initializes the scraper engine. Accepts a custom `RedditClient`, `RedditConfig`, or options object.

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `search(options)` | `{ query, subreddit?, sort?, timeFilter?, limit?, after? }` | `Promise<Post[]>` | Search posts on Reddit |
| `getSubredditPosts(options)` | `{ subreddit, sort?, timeFilter?, limit?, after? }` | `Promise<Post[]>` | Fetch posts from subreddit feed |
| `getSubredditAbout(subreddit)` | `subreddit: string` | `Promise<SubredditInfo>` | Fetch subreddit rules & subscriber metrics |
| `getPost(postIdOrUrl, options?)` | `postIdOrUrl, { sort?, limit?, depth? }` | `Promise<Post>` | Fetch post with complete comment tree |
| `getUserProfile(username)` | `username: string` | `Promise<UserProfile>` | Fetch user profile & karma stats |
| `getUserPosts(username, options?)` | `username, { sort?, limit? }` | `Promise<Post[]>` | Fetch posts submitted by user |
| `getUserComments(username, options?)` | `username, { sort?, limit? }` | `Promise<Comment[]>` | Fetch comments written by user |
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
REDDIT_USER_AGENT=nodejs:com.zetagoaurum.reddit-scraper:v1.0.0 (by /u/your_user)
```

The scraper will automatically acquire OAuth2 Bearer tokens and rotate them transparently!

### Option 2: Session Cookie
If you need to scrape private/quarantined subreddits or NSFW feeds without OAuth:
```env
REDDIT_SESSION_COOKIE=your_reddit_session_cookie
```

---

## 📊 Example Outputs

### JSON Post Output (`examples/outputs/search_results.json`)
```json
{
  "id": "1cv9a01",
  "title": "Showcase: Modern Autonomous Agent Coding Assistant",
  "author": "zetagoaurum",
  "subreddit": "programming",
  "score": 3420,
  "upvoteRatio": 0.96,
  "numComments": 248,
  "createdAt": "2024-04-30T16:00:00.000Z",
  "url": "https://github.com/ZetaGo-Aurum/reddit-scraper",
  "permalink": "https://www.reddit.com/r/programming/comments/1cv9a01",
  "selftext": "We are thrilled to open source our Reddit OSINT engine...",
  "isSelf": true,
  "linkFlairText": "Open Source"
}
```

### Table Terminal View
```text
┌────┬────────────────┬────────┬──────────┬─────────────────────────────────────┬────────────────┐
│ #  │ Subreddit      │ Score  │ Comments │ Title                               │ Author         │
├────┼────────────────┼────────┼──────────┼─────────────────────────────────────┼────────────────┤
│ 1  │ r/programming  │ 3420   │ 248      │ Showcase: Modern Autonomous Agent...│ u/zetagoaurum  │
│ 2  │ r/webdev       │ 1890   │ 115      │ How to bypass Reddit 403 Forbidden..│ u/ai_researcher│
│ 3  │ r/node         │ 1245   │ 87       │ Announcing fast Node.js scraping... │ u/core_dev     │
└────┴────────────────┴────────┴──────────┴─────────────────────────────────────┴────────────────┘
```

More complete samples are located in the [`examples/outputs/`](examples/outputs/) folder:
- [Search Results (JSON)](examples/outputs/search_results.json)
- [Subreddit Feed (CSV)](examples/outputs/subreddit_posts.csv)
- [Subreddit Markdown Table](examples/outputs/subreddit_posts.md)
- [Post with Nested Comments (JSON)](examples/outputs/post_with_comments.json)
- [User Profile (JSON)](examples/outputs/user_profile.json)

---

## 🐍 Python Implementation

A native Python SDK version is also included in the [`python/`](python/) directory for Python engineers:

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
