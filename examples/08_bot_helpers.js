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

const { RedditScraper, formatForBot, extractMedia } = require('../lib');

async function main() {
  const scraper = new RedditScraper({ mock: true });

  // 1. Fetch a random post from r/memes
  const post = await scraper.getRandomPost('memes');
  const media = extractMedia(post);

  console.log('==============================================');
  console.log('  CHATBOT INTEGRATION EXAMPLE (Author: ZetaGo-Aurum)');
  console.log('==============================================\n');

  // WhatsApp Formatting (Baileys / Whiskeysockets)
  console.log('--- 📱 WhatsApp Format (*bold*, _italic_) ---');
  console.log(formatForBot(post, { platform: 'whatsapp' }));
  console.log('Direct Attachment:', media.url);

  console.log('\n--- 💬 Discord Format (**bold**, <url>) ---');
  console.log(formatForBot(post, { platform: 'discord' }));

  console.log('\n--- ✈️ Telegram Format (<b>bold</b>, <i>italic</i>) ---');
  console.log(formatForBot(post, { platform: 'telegram' }));
}

main();
