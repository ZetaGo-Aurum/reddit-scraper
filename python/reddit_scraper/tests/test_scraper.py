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

import unittest
import json
import tempfile
import os
from unittest.mock import MagicMock
from ..models import Post, Comment, SubredditInfo, UserProfile
from ..scraper import RedditScraper
from ..client import RedditClient


# Sample mock fixtures matching Reddit API JSON responses
MOCK_POST_LISTING = {
    "kind": "Listing",
    "data": {
        "after": "t3_sample",
        "dist": 2,
        "children": [
            {
                "kind": "t3",
                "data": {
                    "id": "1abcde",
                    "title": "Introduction to Python 3.14",
                    "author": "python_dev",
                    "subreddit": "Python",
                    "score": 1250,
                    "upvote_ratio": 0.96,
                    "num_comments": 85,
                    "created_utc": 1725000000.0,
                    "url": "https://www.reddit.com/r/Python/comments/1abcde/intro_python_314/",
                    "permalink": "/r/Python/comments/1abcde/intro_python_314/",
                    "selftext": "Here is a complete guide to Python 3.14 features...",
                    "is_self": True,
                    "is_video": False,
                    "over_18": False,
                    "link_flair_text": "Discussion",
                }
            },
            {
                "kind": "t3",
                "data": {
                    "id": "2fghij",
                    "title": "Awesome Linux Desktop Screenshot",
                    "author": "linux_enthusiast",
                    "subreddit": "unixporn",
                    "score": 450,
                    "upvote_ratio": 0.89,
                    "num_comments": 32,
                    "created_utc": 1725005000.0,
                    "url": "https://i.redd.it/sample_image.png",
                    "permalink": "/r/unixporn/comments/2fghij/awesome_linux_desktop/",
                    "selftext": "",
                    "is_self": False,
                    "is_video": False,
                    "over_18": False,
                    "link_flair_text": "Screenshot",
                }
            }
        ]
    }
}

MOCK_POST_WITH_COMMENTS = [
    MOCK_POST_LISTING,  # Post listing
    {
        "kind": "Listing",
        "data": {
            "children": [
                {
                    "kind": "t1",
                    "data": {
                        "id": "c11111",
                        "author": "commenter_one",
                        "body": "This is a great write-up!",
                        "score": 45,
                        "created_utc": 1725001000.0,
                        "permalink": "/r/Python/comments/1abcde/comment/c11111/",
                        "parent_id": "t3_1abcde",
                        "replies": {
                            "kind": "Listing",
                            "data": {
                                "children": [
                                    {
                                        "kind": "t1",
                                        "data": {
                                            "id": "c22222",
                                            "author": "author_reply",
                                            "body": "Thank you! Glad you enjoyed it.",
                                            "score": 12,
                                            "created_utc": 1725002000.0,
                                            "permalink": "/r/Python/comments/1abcde/comment/c22222/",
                                            "parent_id": "t1_c11111",
                                            "replies": ""
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    }
]

MOCK_SUBREDDIT_ABOUT = {
    "kind": "t5",
    "data": {
        "name": "t5_2qh0y",
        "display_name": "Python",
        "title": "Python Programming Language",
        "public_description": "News about the dynamic, interpreted, interactive, object-oriented, extensible programming language Python",
        "description": "Welcome to r/Python!",
        "subscribers": 1400000,
        "active_user_count": 850,
        "created_utc": 1201100000.0,
        "over18": False,
        "url": "/r/Python/",
    }
}

MOCK_USER_ABOUT = {
    "kind": "t2",
    "data": {
        "name": "gvanrossum",
        "id": "1abc",
        "created_utc": 1150000000.0,
        "link_karma": 50000,
        "comment_karma": 80000,
        "total_karma": 130000,
        "is_gold": True,
        "is_mod": True,
        "has_verified_email": True,
        "subreddit": {
            "public_description": "Creator of Python",
        }
    }
}


class TestRedditModels(unittest.TestCase):
    def test_post_parsing(self):
        item = MOCK_POST_LISTING["data"]["children"][0]
        post = Post.from_dict(item)
        self.assertEqual(post.id, "1abcde")
        self.assertEqual(post.title, "Introduction to Python 3.14")
        self.assertEqual(post.author, "python_dev")
        self.assertEqual(post.score, 1250)
        self.assertEqual(post.num_comments, 85)
        self.assertTrue(post.is_self)
        self.assertEqual(post.link_flair_text, "Discussion")

    def test_comment_hierarchy_parsing(self):
        c_item = MOCK_POST_WITH_COMMENTS[1]["data"]["children"][0]
        comment = Comment.from_dict(c_item)
        self.assertIsNotNone(comment)
        self.assertEqual(comment.id, "c11111")
        self.assertEqual(comment.author, "commenter_one")
        self.assertEqual(comment.score, 45)
        self.assertEqual(len(comment.replies), 1)
        
        reply = comment.replies[0]
        self.assertEqual(reply.id, "c22222")
        self.assertEqual(reply.author, "author_reply")
        self.assertEqual(reply.depth, 1)

    def test_subreddit_info_parsing(self):
        sub = SubredditInfo.from_dict(MOCK_SUBREDDIT_ABOUT)
        self.assertEqual(sub.display_name, "Python")
        self.assertEqual(sub.subscribers, 1400000)
        self.assertEqual(sub.active_user_count, 850)
        self.assertFalse(sub.over18)

    def test_user_profile_parsing(self):
        profile = UserProfile.from_dict(MOCK_USER_ABOUT)
        self.assertEqual(profile.username, "gvanrossum")
        self.assertEqual(profile.link_karma, 50000)
        self.assertEqual(profile.comment_karma, 80000)
        self.assertEqual(profile.total_karma, 130000)
        self.assertEqual(profile.bio, "Creator of Python")


class TestRedditScraperLogic(unittest.TestCase):
    def setUp(self):
        self.mock_client = MagicMock(spec=RedditClient)
        self.scraper = RedditScraper(client=self.mock_client)

    def test_search(self):
        self.mock_client.get.return_value = MOCK_POST_LISTING
        results = self.scraper.search("python", sort="top", limit=5)
        
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].title, "Introduction to Python 3.14")
        self.mock_client.get.assert_called_once_with(
            "/search",
            params={"q": "python", "sort": "top", "t": "all", "limit": 5}
        )

    def test_subreddit_posts(self):
        self.mock_client.get.return_value = MOCK_POST_LISTING
        posts = self.scraper.get_subreddit_posts("Python", sort="hot", limit=10)
        
        self.assertEqual(len(posts), 2)
        self.mock_client.get.assert_called_once_with(
            "/r/Python/hot",
            params={"limit": 10}
        )

    def test_subreddit_about(self):
        self.mock_client.get.return_value = MOCK_SUBREDDIT_ABOUT
        info = self.scraper.get_subreddit_about("Python")
        self.assertEqual(info.display_name, "Python")
        self.assertEqual(info.subscribers, 1400000)

    def test_post_with_comments(self):
        self.mock_client.get.return_value = MOCK_POST_WITH_COMMENTS
        post = self.scraper.get_post_with_comments("1abcde", depth=2)
        
        self.assertEqual(post.id, "1abcde")
        self.assertEqual(len(post.comments), 1)
        self.assertEqual(post.comments[0].author, "commenter_one")
        self.assertEqual(len(post.comments[0].replies), 1)

    def test_user_profile(self):
        self.mock_client.get.return_value = MOCK_USER_ABOUT
        user = self.scraper.get_user_profile("gvanrossum")
        self.assertEqual(user.username, "gvanrossum")
        self.assertEqual(user.total_karma, 130000)

    def test_export_json_and_csv(self):
        self.mock_client.get.return_value = MOCK_POST_LISTING
        posts = self.scraper.search("test")

        with tempfile.TemporaryDirectory() as tmpdir:
            json_path = os.path.join(tmpdir, "posts.json")
            csv_path = os.path.join(tmpdir, "posts.csv")

            self.scraper.export_json(posts, json_path)
            self.scraper.export_posts_csv(posts, csv_path)

            self.assertTrue(os.path.exists(json_path))
            self.assertTrue(os.path.exists(csv_path))

            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.assertEqual(len(data), 2)
                self.assertEqual(data[0]["id"], "1abcde")


if __name__ == "__main__":
    unittest.main()
