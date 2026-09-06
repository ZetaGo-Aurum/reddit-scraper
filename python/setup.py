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

from setuptools import setup, find_packages

setup(
    name="zetago-reddit-scraper",
    version="1.0.0",
    author="ZetaGo-Aurum",
    author_email="zetagoaurum@users.noreply.github.com",
    description="Full-featured Reddit Scraper & OSINT Toolkit for Subreddits, Posts, Comments, and Users",
    long_description=open("README.md").read() if open("README.md") else "",
    long_description_content_type="text/markdown",
    url="https://github.com/ZetaGo-Aurum/reddit-scraper",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
        "curl_cffi>=0.7.0",
        "tabulate>=0.9.0",
        "rich>=13.0.0",
    ],
    entry_points={
        "console_scripts": [
            "reddit-scraper-py=reddit_scraper.cli:main",
        ],
    },
)
