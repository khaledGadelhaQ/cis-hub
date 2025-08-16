/**
 * Data Transfer Objects for Queue Jobs
 * 
 * These DTOs define the structure of data passed to queue jobs.
 * They ensure type safety and provide clear contracts for job processors.
 */

// ================================
// NOTIFICATION QUEUE DTOs
// ================================

export interface ChatNotificationJobDto {
  recipientId: string;
  senderId: string;
  senderName: string;
  messageContent: string;
  chatType: 'private' | 'group';
  chatId: string;
  messageId: string;
  priority?: number;
}

export interface BulkNotificationJobDto {
  notifications: Array<{
    recipientId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }>;
  batchSize?: number;
}

export interface PushNotificationJobDto {
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  clickAction?: string;
}

// ================================
// CHAT AUTOMATION QUEUE DTOs
// ================================

export interface RoomCreatedJobDto {
  roomId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
  memberIds: string[];
  metadata?: {
    courseId?: string;
    classId?: string;
    sectionId?: string;
    courseName?: string;
    className?: string;
  };
}

export interface RoomDeletedJobDto {
  roomId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
  memberIds: string[];
}

export interface UserJoinedRoomJobDto {
  userId: string;
  roomId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
}

export interface UserLeftRoomJobDto {
  userId: string;
  roomId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
}

export interface TopicSubscriptionJobDto {
  operation: 'subscribe' | 'unsubscribe';
  userId: string;
  topicName: string;
  metadata?: Record<string, any>;
}

export interface BulkTopicSubscriptionJobDto {
  operation: 'subscribe' | 'unsubscribe';
  userIds: string[];
  topicName: string;
  batchSize?: number;
}

// ================================
// ACADEMIC SYNC QUEUE DTOs
// ================================

export interface BulkEnrollmentJobDto {
  courseId: string;
  classId?: string;
  sectionId?: string;
  userIds: string[];
  operation: 'enroll' | 'unenroll';
  enrollmentRole?: 'STUDENT' | 'INSTRUCTOR' | 'TA';
  batchSize?: number;
  metadata?: {
    semester?: string;
    academicYear?: string;
    enrollmentDate?: string;
  };
}

export interface CourseSyncJobDto {
  courseId: string;
  syncType: 'full' | 'partial';
  data: {
    courseInfo?: any;
    enrollments?: any[];
    classes?: any[];
    sections?: any[];
  };
  sourceSystem?: string; // e.g., 'moodle', 'sis', 'manual'
}

export interface ClassAutomationJobDto {
  eventType: 'class.created' | 'class.updated' | 'class.deleted' | 'enrollment.created' | 'enrollment.deleted';
  payload: {
    classId?: string;
    courseId?: string;
    userId?: string;
    [key: string]: any;
  };
}

// ================================
// EMAIL QUEUE DTOs
// ================================

export interface WelcomeEmailJobDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userRole: string;
  temporaryPassword?: string;
  activationToken?: string;
}

export interface DigestEmailJobDto {
  userId: string;
  digestType: 'daily' | 'weekly' | 'monthly';
  period: {
    startDate: string;
    endDate: string;
  };
  data: {
    newMessages?: number;
    newPosts?: number;
    upcomingDeadlines?: any[];
    courseUpdates?: any[];
  };
}

export interface SystemEmailJobDto {
  recipientIds: string[];
  emailType: 'maintenance' | 'announcement' | 'alert' | 'update';
  subject: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}

// ================================
// MONITORING QUEUE DTOs
// ================================

export interface HealthCheckJobDto {
  checkType: 'database' | 'redis' | 'external_api' | 'storage' | 'comprehensive';
  services?: string[];
  alertOnFailure?: boolean;
  metadata?: Record<string, any>;
}

export interface CleanupTaskJobDto {
  taskType: 'expired_sessions' | 'old_messages' | 'temporary_files' | 'inactive_users' | 'logs';
  criteria: {
    olderThan?: string; // e.g., '30d', '1y'
    status?: string;
    additionalFilters?: Record<string, any>;
  };
  dryRun?: boolean;
}

export interface MetricsCollectionJobDto {
  metricsType: 'user_activity' | 'system_performance' | 'queue_statistics' | 'error_rates';
  timeRange: {
    startDate: string;
    endDate: string;
  };
  aggregation: 'hourly' | 'daily' | 'weekly';
  exportFormat?: 'json' | 'csv';
}

// ================================
// COMMON JOB OPTIONS
// ================================

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  repeat?: {
    cron?: string;
    every?: number;
    limit?: number;
  };
}

// ================================
// JOB RESULT DTOs
// ================================

export interface JobResultDto<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processedAt: string;
    processingTime: number;
    attempts: number;
    [key: string]: any;
  };
}

export interface BulkJobResultDto {
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
  processingTime: number;
}
