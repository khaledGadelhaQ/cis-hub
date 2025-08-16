import { QueueOptions } from 'bullmq';

/**
 * Queue Configuration for MU Compass API
 * 
 * This configuration defines the settings for different queue types:
 * - notifications: Real-time push notifications, chat alerts
 * - chat-automation: Room creation, member management, topic subscriptions
 * - academic-sync: Bulk enrollments, course operations, data syncing
 * - email: Welcome emails, digest emails, system notifications
 * - monitoring: System health checks, cleanup tasks
 */

export interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
  };
}

/**
 * Base Redis connection configuration
 * Uses the same Redis instance as the cache but different database
 */
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_QUEUE_DB || '1'), // Different DB from cache (usually 0)
};

/**
 * Notification Queue Configuration
 * 
 * High-priority, fast processing for real-time notifications
 * - Chat messages: Immediate delivery
 * - Push notifications: 3 retry attempts with exponential backoff
 * - FCM token failures: Automatic cleanup
 */
export const notificationQueueConfig: QueueConfig = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 successful jobs
    removeOnFail: 50,      // Keep last 50 failed jobs for debugging
    attempts: 3,           // Retry failed notifications 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2s, then 4s, then 8s
    },
  },
};

/**
 * Chat Automation Queue Configuration
 * 
 * Medium-priority processing for chat room management
 * - Room creation/deletion: Reliable processing
 * - Member subscriptions: Batch processing capability
 * - Topic management: Eventual consistency is acceptable
 */
export const chatAutomationQueueConfig: QueueConfig = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,         // Fixed 5s delay between retries
    },
  },
};

/**
 * Academic Sync Queue Configuration
 * 
 * Lower-priority but high-reliability for academic operations
 * - Bulk enrollments: Can take time, needs reliability
 * - Course synchronization: Background processing
 * - Data migrations: Long-running tasks
 */
export const academicSyncQueueConfig: QueueConfig = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 30,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,        // 10s delay for academic operations
    },
  },
};

/**
 * Email Queue Configuration
 * 
 * Low-priority background processing for email communications
 * - Welcome emails: Can be delayed slightly
 * - Digest emails: Scheduled, non-urgent
 * - System alerts: Important but not time-critical
 */
export const emailQueueConfig: QueueConfig = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000,        // Start with 30s for email operations
    },
  },
};

/**
 * Monitoring Queue Configuration
 * 
 * System maintenance and monitoring tasks
 * - Health checks: Regular intervals
 * - Cleanup tasks: Daily/weekly schedules
 * - Metrics collection: Background processing
 */
export const monitoringQueueConfig: QueueConfig = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 1,           // Don't retry monitoring tasks
    backoff: {
      type: 'fixed',
      delay: 0,
    },
  },
};

/**
 * Queue Priority Levels
 * Higher number = higher priority
 */
export const QueuePriorities = {
  CRITICAL: 10,    // Chat notifications, security alerts
  HIGH: 7,         // User notifications, real-time updates
  NORMAL: 5,       // Chat automation, academic operations
  LOW: 3,          // Email sending, background tasks
  MAINTENANCE: 1,  // Cleanup, monitoring, analytics
} as const;

/**
 * Job Types for each queue
 * Centralized definition for type safety
 */
export const JobTypes = {
  // Notification Queue
  CHAT_NOTIFICATION: 'chat-notification',
  PUSH_NOTIFICATION: 'push-notification',
  BULK_NOTIFICATIONS: 'bulk-notifications',
  
  // Chat Automation Queue
  ROOM_CREATED: 'room-created',
  ROOM_DELETED: 'room-deleted',
  USER_JOINED_ROOM: 'user-joined-room',
  USER_LEFT_ROOM: 'user-left-room',
  TOPIC_SUBSCRIPTION: 'topic-subscription',
  
  // Academic Sync Queue
  BULK_ENROLLMENT: 'bulk-enrollment',
  COURSE_SYNC: 'course-sync',
  CLASS_AUTOMATION: 'class-automation',
  
  // Email Queue
  WELCOME_EMAIL: 'welcome-email',
  DIGEST_EMAIL: 'digest-email',
  SYSTEM_EMAIL: 'system-email',
  
  // Monitoring Queue
  HEALTH_CHECK: 'health-check',
  CLEANUP_TASK: 'cleanup-task',
  METRICS_COLLECTION: 'metrics-collection',
} as const;

/**
 * Export all queue names for easy reference
 */
export const QueueNames = {
  NOTIFICATIONS: 'notifications',
  CHAT_AUTOMATION: 'chat-automation', 
  ACADEMIC_SYNC: 'academic-sync',
  EMAIL: 'email',
  MONITORING: 'monitoring',
} as const;

/**
 * Queue Concurrency Configuration
 * Based on environment variables with sensible defaults
 */
export const QueueConcurrency = {
  NOTIFICATIONS: parseInt(process.env.QUEUE_CONCURRENCY_NOTIFICATIONS || '5'),
  CHAT_AUTOMATION: parseInt(process.env.QUEUE_CONCURRENCY_CHAT_AUTOMATION || '3'),
  ACADEMIC_SYNC: parseInt(process.env.QUEUE_CONCURRENCY_ACADEMIC_SYNC || '2'),
  EMAIL: parseInt(process.env.QUEUE_CONCURRENCY_EMAIL || '2'),
  MONITORING: parseInt(process.env.QUEUE_CONCURRENCY_MONITORING || '1'),
} as const;
