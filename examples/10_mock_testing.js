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

const assert = require('assert');
const { RedditScraper } = require('../lib');

async function testMockMode() {
  console.log('Testing zero-network mock mode...');
  const scraper = new RedditScraper({ mock: true });

  const posts = await scraper.search({ query: 'offline test' });
  assert.ok(posts.length > 0, 'Should return mock posts');
  console.log(`✔ Mock search: returned ${posts.length} posts with zero network latency`);

  const randomPost = await scraper.getRandomPost('funny');
  assert.ok(randomPost.id, 'Should return random post');
  console.log(`✔ Mock random post: "${randomPost.title}"`);

  const user = await scraper.getUserProfile('ZetaGo-Aurum');
  assert.strictEqual(user.username, 'ZetaGo-Aurum');
  console.log(`✔ Mock user profile: ${user.username} (Karma: ${user.totalKarma})`);

  console.log('\nAll mock tests passed! Super easy to test in CI/CD without API keys.');
}

testMockMode();
