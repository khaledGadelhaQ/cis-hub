import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export interface CacheConfig {
  store: any;
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
  max: number;
  // Redis-specific options
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
}

/**
 * Cache Configuration for Redis
 * 
 * TTL Strategy:
 * - Default: 1 hour (3600s)
 * - Session data: 24 hours
 * - User profiles: 1 hour
 * - Posts feed: 15 minutes
 * - Chat data: 30 minutes
 */
export const cacheConfig: CacheConfig = {
  store: redisStore as any,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_CACHE_DB || '0', 10), // Use dedicated cache database
  ttl: 3600, // Default 1 hour in seconds
  max: 10000, // Maximum number of items in cache
  
  // Redis connection options
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
};

/**
 * Environment-specific cache options
 */
export const getCacheOptions = (): CacheModuleOptions => {
  const baseConfig = { ...cacheConfig };
  
  // Production optimizations
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      ttl: 7200, // 2 hours in production
      max: 50000, // More items in production
    };
  }
  
  // Development settings
  return {
    ...baseConfig,
    ttl: 1800, // 30 minutes in development for faster testing
    max: 1000,
  };
};

/**
 * Cache key prefixes for different data types
 */
export const CacheKeys = {
  // User-related caches
  USER_PROFILE: 'user:profile',
  USER_SESSION: 'user:session',
  USER_PREFERENCES: 'user:prefs',
  
  // Posts-related caches
  POSTS_FEED: 'posts:feed',
  POST_DETAILS: 'posts:details',
  POST_COMMENTS: 'posts:comments',
  
  // Chat-related caches
  CHAT_MEMBERS: 'chat:members',
  CHAT_MESSAGES: 'chat:messages',
  CHAT_ROOMS: 'chat:rooms',
  
  // Academic-related caches
  COURSE_DATA: 'course:data',
  ENROLLMENTS: 'course:enrollments',
  DEPARTMENTS: 'departments:list',
  
  // File-related caches
  FILE_METADATA: 'file:metadata',
  UPLOAD_CONTEXT: 'file:context',
  
  // Notification caches
  NOTIFICATION_PREFS: 'notif:prefs',
  NOTIFICATION_FEED: 'notif:feed',
} as const;

/**
 * TTL values for different cache types (in seconds)
 */
export const CacheTTL = {
  // Critical data - shorter TTL
  USER_SESSION: 24 * 60 * 60, // 24 hours
  USER_PROFILE: 60 * 60, // 1 hour
  
  // Frequently changing data - short TTL
  POSTS_FEED: 15 * 60, // 15 minutes
  CHAT_MESSAGES: 10 * 60, // 10 minutes
  NOTIFICATION_FEED: 5 * 60, // 5 minutes
  
  // Semi-static data - medium TTL
  CHAT_MEMBERS: 30 * 60, // 30 minutes
  COURSE_DATA: 2 * 60 * 60, // 2 hours
  DEPARTMENTS: 4 * 60 * 60, // 4 hours
  
  // Static data - long TTL
  FILE_METADATA: 6 * 60 * 60, // 6 hours
  USER_PREFERENCES: 2 * 60 * 60, // 2 hours
} as const;

/**
 * Helper function to generate cache keys
 */
export class CacheKeyBuilder {
  static userProfile(userId: string): string {
    return `${CacheKeys.USER_PROFILE}:${userId}`;
  }
  
  static userSession(sessionId: string): string {
    return `${CacheKeys.USER_SESSION}:${sessionId}`;
  }
  
  static postsFeed(departmentId: string, page: number, scope?: string): string {
    const scopePart = scope ? `:${scope}` : '';
    return `${CacheKeys.POSTS_FEED}:${departmentId}:${page}${scopePart}`;
  }
  
  static chatMembers(roomId: string): string {
    return `${CacheKeys.CHAT_MEMBERS}:${roomId}`;
  }
  
  static chatMessages(roomId: string, page: number): string {
    return `${CacheKeys.CHAT_MESSAGES}:${roomId}:${page}`;
  }
  
  static courseData(courseId: string): string {
    return `${CacheKeys.COURSE_DATA}:${courseId}`;
  }
  
  static fileMetadata(fileId: string): string {
    return `${CacheKeys.FILE_METADATA}:${fileId}`;
  }
  
  static notificationPrefs(userId: string): string {
    return `${CacheKeys.NOTIFICATION_PREFS}:${userId}`;
  }
}
