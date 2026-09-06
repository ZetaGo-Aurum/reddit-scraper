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

const { createApiServer } = require('../lib');

// Create and launch the REST API server
// Pass { mock: true } for offline testing without hitting Reddit APIs
const { start } = createApiServer({
  port: 3000,
  mock: true, // set to false for production live queries
});

start(({ port, host }) => {
  console.log(`\n🚀 ZetaGo Reddit REST API Server is running at http://${host}:${port}`);
  console.log(`\nTest these endpoints in your browser or curl:`);
  console.log(`  - http://localhost:${port}/health`);
  console.log(`  - http://localhost:${port}/api/search?q=agents&limit=5`);
  console.log(`  - http://localhost:${port}/api/r/programming?sort=top&limit=5`);
  console.log(`  - http://localhost:${port}/api/r/memes/random`);
  console.log(`  - http://localhost:${port}/api/bot/random?subreddit=memes&platform=whatsapp\n`);
});
