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

import { EventEmitter } from 'events';
import { Server } from 'http';

export interface CommentData {
  id: string;
  author: string;
  body: string;
  score: number;
  createdUtc: number;
  createdAt: string | null;
  permalink: string;
  parentId: string;
  depth: number;
  replies: CommentData[];
}

export class Comment {
  id: string;
  author: string;
  body: string;
  score: number;
  createdUtc: number;
  createdAt: string | null;
  permalink: string;
  parentId: string;
  depth: number;
  replies: Comment[];

  constructor(data?: Partial<CommentData>, depth?: number);
  static fromRedditJson(raw: any, depth?: number): Comment | null;
  toJSON(): CommentData;
}

export interface PostData {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  upvoteRatio: number | null;
  numComments: number;
  createdUtc: number;
  createdAt: string | null;
  url: string;
  permalink: string;
  selftext: string;
  isSelf: boolean;
  isVideo: boolean;
  over18: boolean;
  linkFlairText: string | null;
  mediaUrl: string | null;
  comments: CommentData[];
}

export class Post {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  upvoteRatio: number | null;
  numComments: number;
  createdUtc: number;
  createdAt: string | null;
  url: string;
  permalink: string;
  selftext: string;
  isSelf: boolean;
  isVideo: boolean;
  over18: boolean;
  linkFlairText: string | null;
  mediaUrl: string | null;
  comments: Comment[];

  constructor(data?: Partial<PostData>);
  static fromRedditJson(raw: any): Post | null;
  toJSON(): PostData;
}

export interface SubredditInfoData {
  name: string;
  displayName: string;
  title: string;
  publicDescription: string;
  description: string;
  subscribers: number;
  activeUserCount: number | null;
  createdUtc: number;
  createdAt: string | null;
  over18: boolean;
  url: string;
}

export class SubredditInfo {
  name: string;
  displayName: string;
  title: string;
  publicDescription: string;
  description: string;
  subscribers: number;
  activeUserCount: number | null;
  createdUtc: number;
  createdAt: string | null;
  over18: boolean;
  url: string;

  constructor(data?: Partial<SubredditInfoData>);
  static fromRedditJson(raw: any): SubredditInfo | null;
  toJSON(): SubredditInfoData;
}

export interface UserProfileData {
  username: string;
  id: string;
  createdUtc: number;
  createdAt: string | null;
  linkKarma: number;
  commentKarma: number;
  totalKarma: number;
  isGold: boolean;
  isMod: boolean;
  hasVerifiedEmail: boolean | null;
  bio: string;
  iconImg: string | null;
  profileUrl: string;
}

export class UserProfile {
  username: string;
  id: string;
  createdUtc: number;
  createdAt: string | null;
  linkKarma: number;
  commentKarma: number;
  totalKarma: number;
  isGold: boolean;
  isMod: boolean;
  hasVerifiedEmail: boolean | null;
  bio: string;
  iconImg: string | null;
  profileUrl: string;

  constructor(data?: Partial<UserProfileData>);
  static fromRedditJson(raw: any): UserProfile | null;
  toJSON(): UserProfileData;
}

export interface RedditConfigOptions {
  clientId?: string | null;
  clientSecret?: string | null;
  userAgent?: string;
  username?: string | null;
  password?: string | null;
  sessionCookie?: string | null;
  proxy?: string | null;
  timeout?: number;
  mock?: boolean;
}

export class RedditConfig {
  clientId: string | null;
  clientSecret: string | null;
  userAgent: string;
  username: string | null;
  password: string | null;
  sessionCookie: string | null;
  proxy: string | null;
  timeout: number;

  constructor(options?: RedditConfigOptions);
  readonly hasOAuthCredentials: boolean;
  readonly hasCookieCredentials: boolean;
  readonly isAuthenticated: boolean;
  save(): void;
  static readonly configPath: string;
}

export class RedditClient {
  config: RedditConfig;
  constructor(config?: RedditConfig);
  get(endpoint: string, params?: Record<string, any>): Promise<any>;
}

export interface SearchOptions {
  query: string;
  subreddit?: string | null;
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
  timeFilter?: 'all' | 'hour' | 'day' | 'week' | 'month' | 'year';
  limit?: number;
  after?: string | null;
}

export interface SubredditPostsOptions {
  subreddit: string;
  sort?: 'hot' | 'new' | 'top' | 'rising';
  timeFilter?: 'all' | 'day' | 'week' | 'month' | 'year';
  limit?: number;
  after?: string | null;
}

export interface GetPostOptions {
  sort?: 'confidence' | 'top' | 'new' | 'controversial' | 'old';
  limit?: number;
  depth?: number;
}

export interface UserPostsOptions {
  sort?: 'new' | 'hot' | 'top';
  limit?: number;
}

export interface ExportOptions {
  format?: 'json' | 'csv' | 'md' | 'markdown';
  filePath: string;
  title?: string;
}

export interface BotFormatOptions {
  platform?: 'whatsapp' | 'wa' | 'discord' | 'telegram' | 'tg' | 'plain';
  maxTextLength?: number;
  includeMediaUrl?: boolean;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'gallery' | 'link' | 'text';
  url: string;
  isDirect: boolean;
  isRedditVideo?: boolean;
}

export interface WatcherOptions {
  subreddit: string;
  intervalMs?: number;
  limit?: number;
}

export class SubredditWatcher extends EventEmitter {
  constructor(scraper: RedditScraper, options: WatcherOptions);
  start(): this;
  stop(): this;
}


export interface MediaFileItem {
  type: 'video' | 'audio' | 'image' | 'gif' | 'link';
  url: string;
  ext: string;
  width?: number;
  height?: number;
  index?: number;
  filename: string;
}

export interface VideoDetailsItem {
  videoUrl: string;
  audioUrl: string | null;
  hlsUrl: string | null;
  width?: number;
  height?: number;
  duration?: number;
  isGif?: boolean;
}

export interface RedditRawMediaReport {
  postId: string;
  title: string;
  author: string;
  subreddit: string;
  permalink: string;
  mediaType: 'video' | 'gallery' | 'image' | 'gif' | 'external' | 'none';
  hasAudio: boolean;
  files: MediaFileItem[];
  hlsPlaylistUrl: string | null;
  videoDetails: VideoDetailsItem | null;
}

export interface DownloadMediaOptions {
  outputDir?: string;
  mergeAudio?: boolean;
  filename?: string;
}

export interface DownloadResult {
  success: boolean;
  mediaType: string;
  merged: boolean;
  hasAudio: boolean;
  savedFiles: string[];
  totalFiles: number;
}

export interface ApiServerOptions {
  port?: number;
  host?: string;
  mock?: boolean;
  scraper?: RedditScraper;
}

export interface ApiServerInstance {
  server: Server;
  start: (callback?: (info: { port: number; host: string }) => void) => Server;
}

export class RedditScraper {
  client: RedditClient | null;
  isMock: boolean;
  constructor(clientOrConfig?: RedditClient | RedditConfig | RedditConfigOptions);

  search(options: SearchOptions): Promise<Post[]>;
  getSubredditPosts(options: SubredditPostsOptions): Promise<Post[]>;
  getSubredditAbout(subreddit: string): Promise<SubredditInfo>;
  getRandomPost(subreddit?: string, sort?: 'hot' | 'new' | 'top'): Promise<Post>;
  getPost(postIdOrUrl: string, options?: GetPostOptions): Promise<Post>;
  getUserProfile(username: string): Promise<UserProfile>;
  getUserPosts(username: string, options?: UserPostsOptions): Promise<Post[]>;
  getUserComments(username: string, options?: UserPostsOptions): Promise<Comment[]>;
  watchSubreddit(options: WatcherOptions): SubredditWatcher;
  scrapeMedia(postIdOrUrlOrPost: string | Post | any): Promise<RedditRawMediaReport>;
  downloadMedia(postIdOrUrlOrPost: string | Post | any, options?: DownloadMediaOptions): Promise<DownloadResult>;
  formatForBot(post: Post, options?: BotFormatOptions): string;
  extractMedia(post: Post): MediaAttachment;
  export(data: any, options: ExportOptions): string;
}

export function formatForBot(post: Post, options?: BotFormatOptions): string;
export function extractMedia(post: Post): MediaAttachment;
export function createApiServer(options?: ApiServerOptions): ApiServerInstance;
export function extractRawMedia(postOrData: any): RedditRawMediaReport;
export function downloadMedia(postOrData: any, options?: DownloadMediaOptions): Promise<DownloadResult>;
export function isFfmpegAvailable(): Promise<boolean>;

export function exportToJson(data: any, filePath: string): string;
export function exportToCsv(data: any, filePath: string, headers?: string[] | null): string;
export function exportToMarkdown(data: any, filePath: string, title?: string): string;
export function toCsvString(records: any[], headers?: string[] | null): string;
export function truncate(str: string, maxLen?: number): string;

export class RedditAuthenticationError extends Error {}
export class RedditRateLimitError extends Error {
  resetInSeconds: number;
}
export class RedditApiError extends Error {
  statusCode: number;
  data: any;
}

export default RedditScraper;
