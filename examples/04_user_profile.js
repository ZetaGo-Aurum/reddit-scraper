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

  const username = 'spez';
  console.log(`Fetching user profile for u/${username}...`);
  try {
    const profile = await scraper.getUserProfile(username);
    console.log(`\nUser: u/${profile.username}`);
    console.log(`ID: ${profile.id}`);
    console.log(`Total Karma: ${profile.totalKarma.toLocaleString()} (Link: ${profile.linkKarma}, Comment: ${profile.commentKarma})`);
    console.log(`Verified Email: ${profile.hasVerifiedEmail}`);
    console.log(`Profile: ${profile.profileUrl}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
