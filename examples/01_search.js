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

  console.log('Searching Reddit for "Artificial Intelligence"...');
  try {
    const posts = await scraper.search({
      query: 'Artificial Intelligence',
      sort: 'relevance',
      timeFilter: 'week',
      limit: 5,
    });

    console.log(`Found ${posts.length} posts:`);
    posts.forEach((p, i) => {
      console.log(`\n[${i + 1}] ${p.title}`);
      console.log(`    Subreddit : r/${p.subreddit}`);
      console.log(`    Author    : u/${p.author}`);
      console.log(`    Score     : ${p.score} | Comments: ${p.numComments}`);
      console.log(`    URL       : ${p.permalink}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
