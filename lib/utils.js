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

const fs = require('fs');
const path = require('path');

/**
 * Export data array/object to JSON file
 */
function exportToJson(data, filePath) {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(resolved, jsonContent, 'utf-8');
  return resolved;
}

/**
 * Convert array of objects to CSV string
 */
function toCsvString(records, headers = null) {
  if (!Array.isArray(records) || records.length === 0) return '';

  const plainObjects = records.map(r => (r.toJSON ? r.toJSON() : r));
  const keys = headers || Object.keys(plainObjects[0]).filter(k => typeof plainObjects[0][k] !== 'object');

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = keys.map(k => escapeCsv(k)).join(',');
  const rowLines = plainObjects.map(obj => {
    return keys.map(k => escapeCsv(obj[k])).join(',');
  });

  return [headerLine, ...rowLines].join('\n');
}

/**
 * Export array of records to CSV file
 */
function exportToCsv(data, filePath, headers = null) {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const records = Array.isArray(data) ? data : [data];
  const csvContent = toCsvString(records, headers);
  fs.writeFileSync(resolved, csvContent, 'utf-8');
  return resolved;
}

/**
 * Export posts or data to Markdown summary
 */
function exportToMarkdown(data, filePath, title = 'Reddit Scrape Results') {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const records = Array.isArray(data) ? data : [data];
  const lines = [
    `# ${title}`,
    `*Generated on: ${new Date().toISOString()}* | *Author: ZetaGo-Aurum*`,
    '',
    '---',
    '',
  ];

  records.forEach((item, idx) => {
    const p = item.toJSON ? item.toJSON() : item;
    if (p.title) {
      lines.push(`### ${idx + 1}. [${p.title}](${p.permalink || p.url})`);
      lines.push(`- **Subreddit**: \`r/${p.subreddit}\``);
      lines.push(`- **Author**: \`u/${p.author}\``);
      lines.push(`- **Score**: ${p.score} | **Comments**: ${p.numComments}`);
      lines.push(`- **Date**: ${p.createdAt}`);
      if (p.selftext) {
        lines.push('');
        lines.push(`> ${p.selftext.slice(0, 300).replace(/\n/g, '\n> ')}...`);
      }
      lines.push('');
    } else if (p.username) {
      lines.push(`### User: \`u/${p.username}\``);
      lines.push(`- **Total Karma**: ${p.totalKarma} (Link: ${p.linkKarma}, Comment: ${p.commentKarma})`);
      lines.push(`- **Bio**: ${p.bio || 'None'}`);
      lines.push(`- **Profile URL**: ${p.profileUrl}`);
      lines.push('');
    }
  });

  fs.writeFileSync(resolved, lines.join('\n'), 'utf-8');
  return resolved;
}

/**
 * Truncate long strings for console tables
 */
function truncate(str, maxLen = 40) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}

module.exports = {
  exportToJson,
  exportToCsv,
  exportToMarkdown,
  toCsvString,
  truncate,
};
