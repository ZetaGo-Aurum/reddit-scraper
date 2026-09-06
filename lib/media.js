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
const { spawn } = require('child_process');
const axios = require('axios');

/**
 * Decode HTML entities in URLs (e.g., &amp; -> &)
 */
function cleanUrl(url) {
  if (!url) return '';
  return url.replace(/&amp;/g, '&');
}

/**
 * Sanitize filename for safe disk writing
 */
function sanitizeFilename(name, fallback = 'reddit_media') {
  if (!name) return fallback;
  const clean = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return clean.slice(0, 100) || fallback;
}

/**
 * Scrape raw media metadata and direct download URLs from a post object or Reddit raw JSON
 */
function extractRawMedia(postOrData) {
  if (!postOrData) {
    throw new Error('Post data is required to extract raw media');
  }

  // Handle both Post model instance and raw Reddit JSON object
  const data = postOrData.data || postOrData;
  const id = data.id || 'unknown';
  const title = data.title || 'Untitled Post';
  const author = data.author || '[deleted]';
  const subreddit = data.subreddit || '';
  const permalink = data.permalink ? (data.permalink.startsWith('http') ? data.permalink : `https://www.reddit.com${data.permalink}`) : '';
  const postUrl = data.url || '';

  const report = {
    postId: id,
    title,
    author,
    subreddit,
    permalink,
    mediaType: 'none',
    hasAudio: false,
    files: [],
    hlsPlaylistUrl: null,
    videoDetails: null,
  };

  // -------------------------------------------------------------
  // 1. Reddit Native Video (v.redd.it)
  // -------------------------------------------------------------
  if (data.is_video && data.media && data.media.reddit_video) {
    const rv = data.media.reddit_video;
    const fallbackUrl = cleanUrl(rv.fallback_url);
    const hlsUrl = cleanUrl(rv.hls_url);
    const duration = rv.duration || 0;
    const isGif = Boolean(rv.is_gif);

    // Audio stream URL candidate
    let audioUrl = null;
    if (!isGif && fallbackUrl) {
      const baseUrl = fallbackUrl.replace(/\/DASH_[0-9]+.*$/, '');
      audioUrl = `${baseUrl}/DASH_audio.mp4`;
    }

    report.mediaType = isGif ? 'gif' : 'video';
    report.hasAudio = !isGif;
    report.hlsPlaylistUrl = hlsUrl;
    report.videoDetails = {
      videoUrl: fallbackUrl,
      audioUrl: audioUrl,
      hlsUrl: hlsUrl,
      width: rv.width,
      height: rv.height,
      duration: duration,
      isGif: isGif,
    };

    report.files.push({
      type: 'video',
      url: fallbackUrl,
      ext: 'mp4',
      width: rv.width,
      height: rv.height,
      filename: `${sanitizeFilename(title)}_${id}_video.mp4`,
    });

    if (audioUrl && !isGif) {
      report.files.push({
        type: 'audio',
        url: audioUrl,
        ext: 'mp4',
        filename: `${sanitizeFilename(title)}_${id}_audio.mp4`,
      });
    }

    return report;
  }

  // -------------------------------------------------------------
  // 2. Reddit Image Gallery (Multi-photo album)
  // -------------------------------------------------------------
  if (data.gallery_data && data.gallery_data.items && data.media_metadata) {
    report.mediaType = 'gallery';
    const items = data.gallery_data.items;

    items.forEach((item, index) => {
      const mediaId = item.media_id;
      const meta = data.media_metadata[mediaId];
      if (meta && meta.s) {
        let directUrl = meta.s.u ? cleanUrl(meta.s.u) : (meta.s.gif ? cleanUrl(meta.s.gif) : null);
        
        // Convert preview.redd.it to full original i.redd.it
        if (directUrl && directUrl.includes('preview.redd.it')) {
          const ext = meta.m ? meta.m.split('/').pop() : 'jpg';
          directUrl = `https://i.redd.it/${mediaId}.${ext}`;
        }

        if (directUrl) {
          const ext = directUrl.split('.').pop().split('?')[0] || 'jpg';
          report.files.push({
            type: 'image',
            url: directUrl,
            ext,
            width: meta.s.x,
            height: meta.s.y,
            index: index + 1,
            filename: `${sanitizeFilename(title)}_${id}_${index + 1}.${ext}`,
          });
        }
      }
    });

    return report;
  }

  // -------------------------------------------------------------
  // 3. Single Direct Image (i.redd.it / Imgur / direct link)
  // -------------------------------------------------------------
  const imageRegex = /\.(jpg|jpeg|png|webp|bmp|gif)$/i;
  if (imageRegex.test(postUrl) || postUrl.includes('i.redd.it')) {
    const extMatch = postUrl.match(imageRegex);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const isGif = ext === 'gif';

    report.mediaType = isGif ? 'gif' : 'image';
    report.files.push({
      type: isGif ? 'gif' : 'image',
      url: postUrl,
      ext,
      filename: `${sanitizeFilename(title)}_${id}.${ext}`,
    });
    return report;
  }

  // -------------------------------------------------------------
  // 4. Imgur GIFV or MP4
  // -------------------------------------------------------------
  if (postUrl.includes('imgur.com') && postUrl.endsWith('.gifv')) {
    const mp4Url = postUrl.replace(/\.gifv$/i, '.mp4');
    report.mediaType = 'video';
    report.files.push({
      type: 'video',
      url: mp4Url,
      ext: 'mp4',
      filename: `${sanitizeFilename(title)}_${id}.mp4`,
    });
    return report;
  }

  // -------------------------------------------------------------
  // 5. Fallback: Check preview source URL if present
  // -------------------------------------------------------------
  if (data.preview && data.preview.images && data.preview.images[0]) {
    const src = data.preview.images[0].source;
    if (src && src.url) {
      const directUrl = cleanUrl(src.url);
      report.mediaType = 'image';
      report.files.push({
        type: 'image',
        url: directUrl,
        ext: 'jpg',
        width: src.width,
        height: src.height,
        filename: `${sanitizeFilename(title)}_${id}.jpg`,
      });
      return report;
    }
  }

  // External link
  if (postUrl && !data.is_self) {
    report.mediaType = 'external';
    report.files.push({
      type: 'link',
      url: postUrl,
      ext: 'html',
      filename: `${sanitizeFilename(title)}_${id}.html`,
    });
  }

  return report;
}

/**
 * Check if FFmpeg is installed on host system
 */
function isFfmpegAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    timeout: 30000,
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on('finish', () => resolve(destPath));
    writer.on('error', reject);
  });
}

/**
 * Merge separate Reddit video and audio streams using FFmpeg
 */
function mergeVideoAudioWithFfmpeg(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Check if audio file has valid content
    const audioStats = fs.statSync(audioPath);
    const hasValidAudio = audioStats.size > 1024; // > 1KB

    let args = [];
    if (hasValidAudio) {
      args = [
        '-y',
        '-i', videoPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        outputPath,
      ];
    } else {
      // Audio stream is empty or mute, just remux video
      args = [
        '-y',
        '-i', videoPath,
        '-c:v', 'copy',
        '-movflags', '+faststart',
        outputPath,
      ];
    }

    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) {
        // Remove temporary raw video & audio files
        try { fs.unlinkSync(videoPath); } catch (e) {}
        try { fs.unlinkSync(audioPath); } catch (e) {}
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg remuxing failed (code ${code}): ${stderr.slice(-200)}`));
      }
    });
  });
}

/**
 * Download raw media from a Reddit post.
 * Supports single images, full photo galleries, and videos (with automatic audio muxing).
 */
async function downloadMedia(postOrData, options = {}) {
  const outputDir = path.resolve(options.outputDir || process.cwd());
  const mergeAudio = options.mergeAudio !== false;
  const report = extractRawMedia(postOrData);

  if (report.mediaType === 'none' || report.files.length === 0) {
    throw new Error(`Post does not contain any downloadable media (Type: ${report.mediaType})`);
  }

  const savedFiles = [];

  // Special handling for Reddit Videos:
  if (report.mediaType === 'video' && report.videoDetails && mergeAudio) {
    const baseName = sanitizeFilename(report.title, `reddit_${report.postId}`);
    const videoUrl = report.videoDetails.videoUrl;
    const audioUrl = report.videoDetails.audioUrl;
    const finalMp4Path = path.join(outputDir, `${baseName}.mp4`);

    const hasFfmpeg = await isFfmpegAvailable();

    if (hasFfmpeg && audioUrl) {
      const tempVideo = path.join(outputDir, `temp_${report.postId}_video.mp4`);
      const tempAudio = path.join(outputDir, `temp_${report.postId}_audio.mp4`);

      // Download video stream
      await downloadFile(videoUrl, tempVideo);

      // Download audio stream (try-catch in case post is muted/no audio)
      let audioDownloaded = false;
      try {
        await downloadFile(audioUrl, tempAudio);
        audioDownloaded = true;
      } catch (e) {
        audioDownloaded = false;
      }

      if (audioDownloaded) {
        await mergeVideoAudioWithFfmpeg(tempVideo, tempAudio, finalMp4Path);
      } else {
        fs.renameSync(tempVideo, finalMp4Path);
      }

      savedFiles.push(finalMp4Path);
      return {
        success: true,
        mediaType: 'video',
        merged: true,
        hasAudio: audioDownloaded,
        savedFiles,
        totalFiles: 1,
      };
    }
  }

  // Standard multi-file or single-file downloader
  for (const file of report.files) {
    if (file.type === 'link') continue; // Don't download external web pages
    const destPath = path.join(outputDir, file.filename);
    await downloadFile(file.url, destPath);
    savedFiles.push(destPath);
  }

  return {
    success: true,
    mediaType: report.mediaType,
    merged: false,
    hasAudio: report.hasAudio,
    savedFiles,
    totalFiles: savedFiles.length,
  };
}

module.exports = {
  extractRawMedia,
  downloadMedia,
  isFfmpegAvailable,
};
