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

const { RedditScraper, extractRawMedia } = require('../lib');

async function main() {
  const scraper = new RedditScraper({ mock: true });

  console.log('================================================================');
  console.log('  REDDIT RAW MEDIA SCRAPING & DOWNLOADING (Author: ZetaGo-Aurum)');
  console.log('================================================================\n');

  // 1. Scrape raw media metadata
  const post = await scraper.getRandomPost('memes');
  const mediaReport = extractRawMedia(post);

  console.log(`Post Title  : ${mediaReport.title}`);
  console.log(`Media Type  : ${mediaReport.mediaType.toUpperCase()}`);
  console.log(`Has Audio   : ${mediaReport.hasAudio}`);
  console.log(`Files Found : ${mediaReport.files.length}`);

  mediaReport.files.forEach((f, idx) => {
    console.log(`  [${idx + 1}] (${f.type.toUpperCase()}) -> ${f.url}`);
  });

  // 2. Download Media Programmatically (with automatic FFmpeg video+audio muxing)
  console.log('\nDownloading media to ./downloads...');
  try {
    const downloadResult = await scraper.downloadMedia(post, {
      outputDir: './downloads',
      mergeAudio: true, // Merges DASH video + DASH audio if FFmpeg is available
    });

    console.log(`\n✔ Successfully downloaded ${downloadResult.totalFiles} media item(s):`);
    downloadResult.savedFiles.forEach(file => console.log(`  📁 ${file}`));
  } catch (err) {
    console.error(`Download skipped or failed: ${err.message}`);
  }
}

main();
