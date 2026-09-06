# Reddit Scraper (Python SDK)

Author: **ZetaGo-Aurum**  
Repository: https://github.com/ZetaGo-Aurum/reddit-scraper

A full-featured Python toolkit to scrape Reddit search queries, subreddits, posts, comments, and user profiles.

## Installation

```bash
cd python
pip install -r requirements.txt
pip install -e .
```

## CLI Usage

```bash
# Search
reddit-scraper-py search "machine learning" --limit 10

# Subreddit
reddit-scraper-py subreddit programming --sort hot --limit 20

# Post & comments
reddit-scraper-py post <POST_ID_OR_URL> --depth 3

# User profile
reddit-scraper-py user ZetaGo-Aurum
```

## Programmatic Usage

```python
from reddit_scraper import RedditScraper

scraper = RedditScraper()
posts = scraper.search(query="Python", limit=5)
for post in posts:
    print(f"[{post.score}] {post.title} by {post.author}")
```

## Notice & Watermark
All rights reserved by **ZetaGo-Aurum**. Do not remove author credits and watermarks.
