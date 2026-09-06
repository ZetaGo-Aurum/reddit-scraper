#!/usr/bin/env node
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

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const ora = require('ora');
const figlet = require('figlet');
const gradient = require('gradient-string');

const { RedditScraper } = require('../lib/scraper');
const { RedditConfig, CONFIG_FILE } = require('../lib/config');
const { truncate, exportToJson, exportToCsv, exportToMarkdown } = require('../lib/utils');
const { formatForBot, extractMedia } = require('../lib/bot');
const { createApiServer } = require('../lib/server');
const pkg = require('../package.json');

const program = new Command();

function printBanner() {
  const banner = figlet.textSync('REDDIT SCRAPER', { font: 'Standard' });
  console.log(gradient.pastel.multiline(banner));
  console.log(chalk.bold.hex('#FF4500')(` 🔥 Reddit OSINT, Bot & API Engine v${pkg.version}`));
  console.log(chalk.cyan(` 👤 Author: ZetaGo-Aurum  |  🔗 https://github.com/ZetaGo-Aurum/reddit-scraper`));
  console.log(chalk.gray(` --------------------------------------------------------------------------------\n`));
}

function handleOutput(data, format, output, type = 'posts') {
  if (output) {
    const ext = format.toLowerCase();
    if (ext === 'json') {
      exportToJson(data, output);
    } else if (ext === 'csv') {
      exportToCsv(data, output);
    } else if (ext === 'md' || ext === 'markdown') {
      exportToMarkdown(data, output);
    } else {
      exportToJson(data, output);
    }
    console.log(chalk.green(`\n✔ Data successfully exported to: ${chalk.bold(output)}`));
    return;
  }

  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (format === 'csv') {
    const { toCsvString } = require('../lib/utils');
    console.log(toCsvString(Array.isArray(data) ? data : [data]));
    return;
  }

  // Table view default
  if (type === 'posts') {
    const table = new Table({
      head: [
        chalk.cyan('#'),
        chalk.cyan('Subreddit'),
        chalk.cyan('Score'),
        chalk.cyan('Comments'),
        chalk.cyan('Title'),
        chalk.cyan('Author'),
      ],
      colWidths: [4, 16, 8, 10, 38, 16],
      wordWrap: true,
    });

    data.forEach((p, idx) => {
      table.push([
        idx + 1,
        `r/${p.subreddit}`,
        p.score,
        p.numComments,
        truncate(p.title, 35),
        `u/${p.author}`,
      ]);
    });
    console.log(table.toString());
  } else if (type === 'user') {
    const table = new Table({
      head: [chalk.cyan('Property'), chalk.cyan('Value')],
      colWidths: [22, 55],
      wordWrap: true,
    });
    table.push(
      ['Username', `u/${data.username}`],
      ['ID', data.id || 'N/A'],
      ['Total Karma', `${data.totalKarma} (Link: ${data.linkKarma}, Comment: ${data.commentKarma})`],
      ['Gold Member', data.isGold ? 'Yes' : 'No'],
      ['Moderator', data.isMod ? 'Yes' : 'No'],
      ['Created UTC', data.createdAt || 'N/A'],
      ['Profile URL', data.profileUrl],
      ['Bio', data.bio || 'None']
    );
    console.log(table.toString());
  } else if (type === 'subreddit') {
    const table = new Table({
      head: [chalk.cyan('Property'), chalk.cyan('Value')],
      colWidths: [22, 55],
      wordWrap: true,
    });
    table.push(
      ['Name', `r/${data.displayName}`],
      ['Title', data.title || 'N/A'],
      ['Subscribers', data.subscribers.toLocaleString()],
      ['Active Users', data.activeUserCount ? data.activeUserCount.toLocaleString() : 'N/A'],
      ['NSFW (Over 18)', data.over18 ? 'Yes' : 'No'],
      ['URL', data.url],
      ['Description', truncate(data.publicDescription || data.description, 120)]
    );
    console.log(table.toString());
  }
}

// -------------------------------------------------------------
// Program Setup
// -------------------------------------------------------------
program
  .name('reddit-scraper')
  .description('High-performance Reddit Scraper & OSINT Engine by ZetaGo-Aurum')
  .version(pkg.version);

// Command: Search
program
  .command('search <query>')
  .description('Search Reddit posts globally or in a subreddit')
  .option('-s, --subreddit <subr>', 'Restrict search to specific subreddit')
  .option('--sort <sort>', 'Sort results (relevance, hot, top, new, comments)', 'relevance')
  .option('-t, --time <time>', 'Time filter (all, hour, day, week, month, year)', 'all')
  .option('-l, --limit <limit>', 'Number of results (max 100)', (v) => parseInt(v, 10), 25)
  .option('-f, --format <format>', 'Output format (table, json, csv, md)', 'table')
  .option('-o, --output <file>', 'Save output to a file')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action(async (query, opts) => {
    printBanner();
    const spinner = ora(`Searching Reddit for "${query}"...`).start();
    try {
      const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
      const posts = await scraper.search({
        query,
        subreddit: opts.subreddit,
        sort: opts.sort,
        timeFilter: opts.time,
        limit: opts.limit,
      });
      spinner.succeed(`Found ${posts.length} posts matching "${query}" ${opts.mock ? '(MOCK)' : ''}`);
      handleOutput(posts, opts.format, opts.output, 'posts');
    } catch (err) {
      spinner.fail(`Search failed: ${err.message}`);
      process.exit(1);
    }
  });

// Command: Subreddit
program
  .command('subreddit <name>')
  .alias('sub')
  .description('Scrape posts from a subreddit')
  .option('--sort <sort>', 'Sort posts (hot, new, top, rising)', 'hot')
  .option('-t, --time <time>', 'Time filter for top sort (all, day, week, month, year)', 'all')
  .option('-l, --limit <limit>', 'Number of posts (max 100)', (v) => parseInt(v, 10), 25)
  .option('-f, --format <format>', 'Output format (table, json, csv, md)', 'table')
  .option('-o, --output <file>', 'Save output to a file')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action(async (name, opts) => {
    printBanner();
    const spinner = ora(`Scraping r/${name} (${opts.sort})...`).start();
    try {
      const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
      const posts = await scraper.getSubredditPosts({
        subreddit: name,
        sort: opts.sort,
        timeFilter: opts.time,
        limit: opts.limit,
      });
      spinner.succeed(`Scraped ${posts.length} posts from r/${name} ${opts.mock ? '(MOCK)' : ''}`);
      handleOutput(posts, opts.format, opts.output, 'posts');
    } catch (err) {
      spinner.fail(`Scraping failed: ${err.message}`);
      process.exit(1);
    }
  });

// Command: Random Post (for Bots)
program
  .command('random [subreddit]')
  .description('Fetch a random post or media from a subreddit (ideal for bots)')
  .option('-p, --platform <platform>', 'Format text for platform (whatsapp, discord, telegram, plain)', 'whatsapp')
  .option('--media', 'Show only direct media attachment URL')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action(async (subreddit = 'memes', opts) => {
    printBanner();
    const spinner = ora(`Fetching random post from r/${subreddit}...`).start();
    try {
      const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
      const post = await scraper.getRandomPost(subreddit);
      const media = extractMedia(post);
      spinner.succeed(`Fetched random post from r/${subreddit} ${opts.mock ? '(MOCK)' : ''}`);

      if (opts.media) {
        console.log(chalk.bold('Media URL:'), chalk.green(media.url || 'No direct media'));
        return;
      }

      console.log(chalk.yellow(`\n--- [Bot Format: ${opts.platform.toUpperCase()}] ---`));
      console.log(formatForBot(post, { platform: opts.platform }));
      if (media.url) {
        console.log(chalk.cyan(`\nAttachment [${media.type.toUpperCase()}]:`), media.url);
      }
    } catch (err) {
      spinner.fail(`Failed to fetch random post: ${err.message}`);
      process.exit(1);
    }
  });

// Command: Watch Subreddit (for Bots & Streamers)
program
  .command('watch <subreddit>')
  .description('Live poll and watch a subreddit for new incoming submissions')
  .option('-i, --interval <sec>', 'Polling interval in seconds (min 5s)', (v) => parseInt(v, 10), 15)
  .option('-p, --platform <platform>', 'Format notification for bot (whatsapp, discord, telegram)', 'whatsapp')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action((subreddit, opts) => {
    printBanner();
    console.log(chalk.green(`👀 Watching r/${subreddit} for new posts every ${opts.interval}s...`));
    console.log(chalk.gray(`Press Ctrl+C to terminate stream.\n`));

    const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
    const watcher = scraper.watchSubreddit({
      subreddit,
      intervalMs: opts.interval * 1000,
    });

    watcher.on('ready', (evt) => {
      console.log(chalk.blue(`✔ Connected to r/${evt.subreddit}. Initialized with ${evt.initialCount} existing posts.`));
    });

    watcher.on('post', (post) => {
      console.log(chalk.green(`\n🔔 [NEW POST in r/${post.subreddit}]`));
      console.log(formatForBot(post, { platform: opts.platform }));
      const media = extractMedia(post);
      if (media.url) console.log(chalk.cyan(`Media:`), media.url);
      console.log(chalk.gray('--------------------------------------------------'));
    });

    watcher.on('error', (err) => {
      console.error(chalk.red(`[Watcher Error] ${err.message}`));
    });

    process.on('SIGINT', () => {
      watcher.stop();
      console.log(chalk.yellow('\nStopped subreddit watcher.'));
      process.exit(0);
    });
  });

// Command: REST API Server
program
  .command('serve')
  .description('Start a local REST API microservice with CORS enabled')
  .option('-p, --port <port>', 'Port number to listen on', (v) => parseInt(v, 10), 3000)
  .option('-h, --host <host>', 'Host address to bind to', '0.0.0.0')
  .option('--mock', 'Run API server in mock mode (instant offline testing)')
  .action((opts) => {
    printBanner();
    const { server, start } = createApiServer({
      port: opts.port,
      host: opts.host,
      mock: Boolean(opts.mock),
    });

    start(({ port, host }) => {
      console.log(chalk.bold.green(`🚀 ZetaGo Reddit REST API Server is running!`));
      console.log(`📡 URL: ${chalk.cyan(`http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)}`);
      console.log(`📚 Endpoints:`);
      console.log(`   - ${chalk.yellow(`GET http://localhost:${port}/api/search?q=nodejs`)}`);
      console.log(`   - ${chalk.yellow(`GET http://localhost:${port}/api/r/programming`)}`);
      console.log(`   - ${chalk.yellow(`GET http://localhost:${port}/api/r/memes/random`)}`);
      console.log(`   - ${chalk.yellow(`GET http://localhost:${port}/api/bot/random?subreddit=memes&platform=whatsapp`)}`);
      console.log(`   - ${chalk.yellow(`GET http://localhost:${port}/health`)}`);
      console.log(chalk.gray(`\nMode: ${opts.mock ? chalk.yellow('MOCK (Offline / Zero Rate-Limit)') : chalk.green('LIVE API')}`));
      console.log(chalk.gray(`Press Ctrl+C to stop server.\n`));
    });
  });

// Command: About Subreddit
program
  .command('about <subreddit>')
  .description('Get metadata and metrics for a subreddit')
  .option('-f, --format <format>', 'Output format (table, json)', 'table')
  .option('-o, --output <file>', 'Save output to a file')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action(async (subreddit, opts) => {
    printBanner();
    const spinner = ora(`Fetching details for r/${subreddit}...`).start();
    try {
      const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
      const info = await scraper.getSubredditAbout(subreddit);
      spinner.succeed(`Retrieved info for r/${subreddit} ${opts.mock ? '(MOCK)' : ''}`);
      handleOutput(info, opts.format, opts.output, 'subreddit');
    } catch (err) {
      spinner.fail(`Failed to fetch subreddit: ${err.message}`);
      process.exit(1);
    }
  });

// Command: Post & Comments
program
  .command('post <id_or_url>')
  .description('Scrape a post with full comment tree')
  .option('-d, --depth <depth>', 'Comment tree depth', (v) => parseInt(v, 10), 3)
  .option('-l, --limit <limit>', 'Maximum comments', (v) => parseInt(v, 10), 50)
  .option('-f, --format <format>', 'Output format (table, json, md)', 'json')
  .option('-o, --output <file>', 'Save output to a file')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action(async (idOrUrl, opts) => {
    printBanner();
    const spinner = ora(`Scraping post and comments...`).start();
    try {
      const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
      const post = await scraper.getPost(idOrUrl, {
        depth: opts.depth,
        limit: opts.limit,
      });
      spinner.succeed(`Scraped post "${truncate(post.title, 40)}" with ${post.comments.length} top comments ${opts.mock ? '(MOCK)' : ''}`);
      handleOutput(post, opts.format, opts.output, 'posts');
    } catch (err) {
      spinner.fail(`Failed to scrape post: ${err.message}`);
      process.exit(1);
    }
  });

// Command: User Profile
program
  .command('user <username>')
  .description('Scrape user profile and karma stats')
  .option('--posts', 'Also scrape user recent submitted posts')
  .option('--comments', 'Also scrape user recent comments')
  .option('-l, --limit <limit>', 'Number of user posts/comments', (v) => parseInt(v, 10), 10)
  .option('-f, --format <format>', 'Output format (table, json, csv)', 'table')
  .option('-o, --output <file>', 'Save output to a file')
  .option('--mock', 'Run in mock mode (offline testing)')
  .action(async (username, opts) => {
    printBanner();
    const spinner = ora(`Fetching profile for u/${username}...`).start();
    try {
      const scraper = new RedditScraper({ mock: Boolean(opts.mock) });
      const profile = await scraper.getUserProfile(username);
      spinner.succeed(`Fetched profile for u/${username} ${opts.mock ? '(MOCK)' : ''}`);

      if (opts.posts) {
        spinner.start(`Fetching posts by u/${username}...`);
        const posts = await scraper.getUserPosts(username, { limit: opts.limit });
        spinner.succeed(`Fetched ${posts.length} posts by u/${username}`);
        handleOutput(posts, opts.format, opts.output, 'posts');
        return;
      }

      if (opts.comments) {
        spinner.start(`Fetching comments by u/${username}...`);
        const comments = await scraper.getUserComments(username, { limit: opts.limit });
        spinner.succeed(`Fetched ${comments.length} comments by u/${username}`);
        handleOutput(comments, opts.format, opts.output, 'posts');
        return;
      }

      handleOutput(profile, opts.format, opts.output, 'user');
    } catch (err) {
      spinner.fail(`Failed to scrape user: ${err.message}`);
      process.exit(1);
    }
  });

// Command: Config
program
  .command('config')
  .description('Configure credentials or view current settings')
  .option('--set-client-id <id>', 'Set Reddit OAuth Client ID')
  .option('--set-client-secret <secret>', 'Set Reddit OAuth Client Secret')
  .option('--set-user-agent <agent>', 'Set Custom User-Agent')
  .option('--set-cookie <cookie>', 'Set Reddit Session Cookie')
  .action((opts) => {
    printBanner();
    const cfg = new RedditConfig();

    if (opts.setClientId) cfg.clientId = opts.setClientId;
    if (opts.setClientSecret) cfg.clientSecret = opts.setClientSecret;
    if (opts.setUserAgent) cfg.userAgent = opts.setUserAgent;
    if (opts.setCookie) cfg.sessionCookie = opts.setCookie;

    if (opts.setClientId || opts.setClientSecret || opts.setUserAgent || opts.setCookie) {
      cfg.save();
      console.log(chalk.green(`✔ Configuration saved to ${CONFIG_FILE}`));
    } else {
      console.log(chalk.cyan(`Config file: ${CONFIG_FILE}`));
      console.log(chalk.bold('Current configuration:'));
      console.log(`  Client ID     : ${cfg.clientId ? chalk.green('Configured') : chalk.gray('None')}`);
      console.log(`  Client Secret : ${cfg.clientSecret ? chalk.green('Configured') : chalk.gray('None')}`);
      console.log(`  User Agent    : ${chalk.yellow(cfg.userAgent)}`);
      console.log(`  Session Cookie: ${cfg.sessionCookie ? chalk.green('Configured') : chalk.gray('None')}`);
      console.log(`  Is Authenticated: ${cfg.isAuthenticated ? chalk.green('YES') : chalk.yellow('NO (Anonymous Mode)')}`);
    }
  });

program.parse(process.argv);
