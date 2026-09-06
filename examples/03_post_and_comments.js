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

const { RedditScraper } = require('../lib');

async function main() {
  const scraper = new RedditScraper();

  const postId = '1b1aaaa'; // Example post ID
  console.log(`Fetching post & comments for ${postId}...`);
  try {
    const post = await scraper.getPost(postId, { limit: 10, depth: 2 });
    console.log(`\nTitle: ${post.title}`);
    console.log(`Author: u/${post.author} in r/${post.subreddit}`);
    console.log(`Selftext: ${post.selftext.slice(0, 150)}...`);
    console.log(`\nTop Comments (${post.comments.length}):`);

    post.comments.forEach((c, idx) => {
      console.log(`  [${idx + 1}] u/${c.author} (+${c.score}): ${c.body.slice(0, 80)}`);
      if (c.replies.length > 0) {
        c.replies.forEach((r) => {
          console.log(`      ↳ u/${r.author} (+${r.score}): ${r.body.slice(0, 60)}`);
        });
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
