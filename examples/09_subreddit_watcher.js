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

const { RedditScraper, formatForBot } = require('../lib');

const scraper = new RedditScraper({ mock: true });

console.log('Starting Subreddit Watcher stream for r/technology...');
const watcher = scraper.watchSubreddit({
  subreddit: 'technology',
  intervalMs: 5000, // 5 seconds interval
});

watcher.on('ready', ({ subreddit, initialCount }) => {
  console.log(`[READY] Subscribed to r/${subreddit}. Initial cached posts: ${initialCount}`);
  console.log(`Listening for incoming new submissions...\n`);
});

watcher.on('post', (post) => {
  console.log('[NEW SUBMISSION DETECTED]');
  console.log(formatForBot(post, { platform: 'whatsapp' }));
  console.log('--------------------------------------------------');
});

// Stop watcher after 15 seconds for example demo
setTimeout(() => {
  watcher.stop();
  console.log('\nWatcher stopped cleanly.');
  process.exit(0);
}, 15000);
