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

export class RedditScraper {
  client: RedditClient;
  constructor(clientOrConfig?: RedditClient | RedditConfig | RedditConfigOptions);

  search(options: SearchOptions): Promise<Post[]>;
  getSubredditPosts(options: SubredditPostsOptions): Promise<Post[]>;
  getSubredditAbout(subreddit: string): Promise<SubredditInfo>;
  getPost(postIdOrUrl: string, options?: GetPostOptions): Promise<Post>;
  getUserProfile(username: string): Promise<UserProfile>;
  getUserPosts(username: string, options?: UserPostsOptions): Promise<Post[]>;
  getUserComments(username: string, options?: UserPostsOptions): Promise<Comment[]>;
  export(data: any, options: ExportOptions): string;
}

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
