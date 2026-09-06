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

  console.log('Fetching Top posts from r/programming...');
  try {
    const posts = await scraper.getSubredditPosts({
      subreddit: 'programming',
      sort: 'top',
      timeFilter: 'month',
      limit: 5,
    });

    console.log(`Fetched ${posts.length} posts:`);
    posts.forEach((p, i) => {
      console.log(`\n#${i + 1} [${p.score} pts] ${p.title}`);
      console.log(`    by u/${p.author} in r/${p.subreddit}`);
      console.log(`    Comments: ${p.numComments} | Created: ${p.createdAt}`);
      console.log(`    Link: ${p.permalink}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
