# ====================================================================
#                 REDDIT SCRAPER CORE & CLI ENGINE
# ====================================================================
#  Author      : ZetaGo-Aurum
#  GitHub      : https://github.com/ZetaGo-Aurum
#  Repository  : https://github.com/ZetaGo-Aurum/reddit-scraper
#  License     : MIT
#
#  [NOTICE & WATERMARK]
#  DO NOT REMOVE THIS WATERMARK OR AUTHOR CREDITS!
#  This software is created and maintained by ZetaGo-Aurum.
#  All rights reserved. Unauthorized removal of this header is prohibited.
# ====================================================================

import argparse
import sys
import json
from .config import RedditConfig
from .client import RedditClient, RedditAuthenticationError
from .scraper import RedditScraper


def print_banner():
    print("=" * 60)
    print("           REDDIT SCRAPER CLI v1.0")
    print("=" * 60)


def handle_search(args, scraper: RedditScraper):
    print(f"[*] Searching Reddit for '{args.query}' (subreddit: {args.subreddit or 'ALL'}, sort: {args.sort}, limit: {args.limit})...")
    posts = scraper.search(
        query=args.query,
        subreddit=args.subreddit,
        sort=args.sort,
        time_filter=args.time,
        limit=args.limit,
    )
    print(f"[+] Found {len(posts)} posts:")
    for i, p in enumerate(posts, 1):
        print(f"\n{i}. [{p.subreddit}] {p.title}")
        print(f"   Author: u/{p.author} | Score: {p.score} | Comments: {p.num_comments}")
        print(f"   Link: {p.permalink}")
        if p.selftext:
            snippet = p.selftext[:120].replace("\n", " ")
            print(f"   Body: {snippet}...")

    if args.output:
        if args.output.endswith(".csv"):
            scraper.export_posts_csv(posts, args.output)
        else:
            scraper.export_json(posts, args.output)
        print(f"\n[✓] Results exported to {args.output}")


def handle_subreddit(args, scraper: RedditScraper):
    sub = args.name.replace("r/", "").replace("/r/", "")
    if args.about:
        print(f"[*] Fetching metadata for r/{sub}...")
        info = scraper.get_subreddit_about(sub)
        print(f"\n[+] r/{info.display_name} — {info.title}")
        print(f"   Subscribers: {info.subscribers:,}")
        if info.active_user_count:
            print(f"   Active users: {info.active_user_count:,}")
        print(f"   Description: {info.public_description}")
        print(f"   URL: {info.url}")
        if args.output:
            scraper.export_json(info, args.output)
            print(f"\n[✓] Metadata exported to {args.output}")
        return

    print(f"[*] Scraping posts from r/{sub} (sort: {args.sort}, limit: {args.limit})...")
    posts = scraper.get_subreddit_posts(
        subreddit=sub,
        sort=args.sort,
        time_filter=args.time,
        limit=args.limit,
    )
    print(f"[+] Fetched {len(posts)} posts:")
    for i, p in enumerate(posts, 1):
        print(f"\n{i}. {p.title}")
        print(f"   Author: u/{p.author} | Score: {p.score} | Comments: {p.num_comments}")
        print(f"   Link: {p.permalink}")

    if args.output:
        if args.output.endswith(".csv"):
            scraper.export_posts_csv(posts, args.output)
        else:
            scraper.export_json(posts, args.output)
        print(f"\n[✓] Results exported to {args.output}")


def handle_post(args, scraper: RedditScraper):
    print(f"[*] Fetching post and comments for '{args.id_or_url}'...")
    post = scraper.get_post_with_comments(
        post_id_or_url=args.id_or_url,
        sort=args.sort,
        limit=args.limit,
        depth=args.depth,
    )
    print(f"\n[+] [{post.subreddit}] {post.title}")
    print(f"   Author: u/{post.author} | Score: {post.score} | Total Comments: {post.num_comments}")
    print(f"   URL: {post.permalink}")
    if post.selftext:
        print(f"\n--- Post Text ---\n{post.selftext[:500]}")
    
    print(f"\n--- Top Comments ({len(post.comments)} direct comments) ---")
    for c in post.comments[:10]:
        print(f"\n  [u/{c.author}] (Score: {c.score})")
        print(f"  {c.body[:150].replace(chr(10), ' ')}")
        if c.replies:
            print(f"    ↳ {len(c.replies)} replies")

    if args.output:
        scraper.export_json(post, args.output)
        print(f"\n[✓] Full post and comment tree exported to {args.output}")


def handle_user(args, scraper: RedditScraper):
    user = args.username.replace("u/", "").replace("/u/", "")
    print(f"[*] Fetching profile for u/{user}...")
    profile = scraper.get_user_profile(user)
    print(f"\n[+] User: u/{profile.username} (ID: {profile.id})")
    print(f"   Total Karma: {profile.total_karma:,} (Post: {profile.link_karma:,} | Comment: {profile.comment_karma:,})")
    if profile.bio:
        print(f"   Bio: {profile.bio}")
    print(f"   Profile: {profile.profile_url}")

    if args.posts:
        print(f"\n[*] Fetching recent posts by u/{user}...")
        posts = scraper.get_user_posts(user, limit=args.limit)
        print(f"[+] Found {len(posts)} posts:")
        for i, p in enumerate(posts, 1):
            print(f"  {i}. [{p.subreddit}] {p.title} (Score: {p.score})")
        if args.output:
            scraper.export_json(posts, args.output)
            print(f"\n[✓] Posts exported to {args.output}")

    elif args.comments:
        print(f"\n[*] Fetching recent comments by u/{user}...")
        comments = scraper.get_user_comments(user, limit=args.limit)
        print(f"[+] Found {len(comments)} comments:")
        for i, c in enumerate(comments, 1):
            print(f"  {i}. (Score: {c.score}) {c.body[:120].replace(chr(10), ' ')}...")
        if args.output:
            scraper.export_json(comments, args.output)
            print(f"\n[✓] Comments exported to {args.output}")

    elif args.output:
        scraper.export_json(profile, args.output)
        print(f"\n[✓] Profile exported to {args.output}")


def handle_config(args):
    config = RedditConfig()
    if args.show:
        print("\n=== Current Reddit Scraper Configuration ===")
        print(f"Client ID      : {'***' + config.client_id[-4:] if config.client_id else '(Not set)'}")
        print(f"Client Secret  : {'***' if config.client_secret else '(Not set)'}")
        print(f"User Agent     : {config.user_agent}")
        print(f"Username       : {config.username or '(Not set)'}")
        print(f"Session Cookie : {'***' if config.session_cookie else '(Not set)'}")
        print(f"Authenticated  : {config.is_authenticated}")
        return

    updated = False
    if args.client_id:
        config.client_id = args.client_id
        updated = True
    if args.client_secret:
        config.client_secret = args.client_secret
        updated = True
    if args.user_agent:
        config.user_agent = args.user_agent
        updated = True
    if args.username:
        config.username = args.username
        updated = True
    if args.password:
        config.password = args.password
        updated = True
    if args.cookie:
        config.session_cookie = args.cookie
        updated = True

    if updated:
        config.save()
        print("[✓] Configuration saved successfully to ~/.config/reddit_scraper/config.json")
    else:
        print("Use --show or specify parameters like --client-id, --client-secret, --cookie to save config.")


def main():
    parser = argparse.ArgumentParser(description="Reddit Scraper CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Search
    p_search = subparsers.add_parser("search", help="Search Reddit posts")
    p_search.add_argument("query", help="Search query keyword")
    p_search.add_argument("--subreddit", "-r", help="Restrict to subreddit")
    p_search.add_argument("--sort", default="relevance", choices=["relevance", "hot", "top", "new", "comments"])
    p_search.add_argument("--time", "-t", default="all", choices=["all", "hour", "day", "week", "month", "year"])
    p_search.add_argument("--limit", "-n", type=int, default=25)
    p_search.add_argument("--output", "-o", help="Save results to JSON or CSV file")

    # Subreddit
    p_sub = subparsers.add_parser("subreddit", help="Scrape a subreddit")
    p_sub.add_argument("name", help="Subreddit name (e.g. 'programming')")
    p_sub.add_argument("--sort", default="hot", choices=["hot", "new", "top", "rising"])
    p_sub.add_argument("--time", "-t", default="all", choices=["all", "day", "week", "month", "year"])
    p_sub.add_argument("--limit", "-n", type=int, default=25)
    p_sub.add_argument("--about", action="store_true", help="Fetch subreddit metadata and subscriber stats")
    p_sub.add_argument("--output", "-o", help="Save results to JSON or CSV file")

    # Post
    p_post = subparsers.add_parser("post", help="Scrape a post and its comments")
    p_post.add_argument("id_or_url", help="Post ID or full Reddit URL")
    p_post.add_argument("--sort", default="confidence", choices=["confidence", "top", "new", "controversial", "old"])
    p_post.add_argument("--limit", "-n", type=int, default=50)
    p_post.add_argument("--depth", "-d", type=int, default=3)
    p_post.add_argument("--output", "-o", help="Save results to JSON file")

    # User
    p_user = subparsers.add_parser("user", help="Scrape user profile, posts or comments")
    p_user.add_argument("username", help="Reddit username")
    p_user.add_argument("--posts", action="store_true", help="Fetch submitted posts")
    p_user.add_argument("--comments", action="store_true", help="Fetch submitted comments")
    p_user.add_argument("--limit", "-n", type=int, default=25)
    p_user.add_argument("--output", "-o", help="Save results to JSON file")

    # Config
    p_cfg = subparsers.add_parser("config", help="Manage Reddit credentials")
    p_cfg.add_argument("--show", action="store_true", help="Show current config")
    p_cfg.add_argument("--client-id", help="Reddit API client ID")
    p_cfg.add_argument("--client-secret", help="Reddit API client secret")
    p_cfg.add_argument("--user-agent", help="Custom user agent")
    p_cfg.add_argument("--username", help="Reddit username")
    p_cfg.add_argument("--password", help="Reddit password")
    p_cfg.add_argument("--cookie", help="Reddit session cookie (reddit_session)")

    # Test
    subparsers.add_parser("test", help="Run comprehensive test suite")

    args = parser.parse_args()

    if not args.command:
        print_banner()
        parser.print_help()
        return

    if args.command == "config":
        handle_config(args)
        return

    if args.command == "test":
        from .tests import run_tests
        run_tests()
        return

    client = RedditClient()
    scraper = RedditScraper(client=client)

    try:
        if args.command == "search":
            handle_search(args, scraper)
        elif args.command == "subreddit":
            handle_subreddit(args, scraper)
        elif args.command == "post":
            handle_post(args, scraper)
        elif args.command == "user":
            handle_user(args, scraper)
    except RedditAuthenticationError as e:
        print(f"\n[!] Authentication Error: {e}")
        print("\nUntuk mengonfigurasi kredensial Reddit, Anda dapat:")
        print("  1. Menjalankan: python -m reddit_scraper config --client-id YOUR_ID --client-secret YOUR_SECRET")
        print("  2. Atau menyimpan file .env di direktori scraper:")
        print("     REDDIT_CLIENT_ID=your_id")
        print("     REDDIT_CLIENT_SECRET=your_secret")
        print("     REDDIT_USER_AGENT=my_scraper:v1.0 (by /u/your_username)")
        sys.exit(1)
    except Exception as e:
        print(f"\n[!] Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
