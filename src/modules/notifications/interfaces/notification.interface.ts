// Notification Types and Interfaces

import { NotificationType } from '@prisma/client';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sourceId?: string;
  sourceType?: string;
  scheduledFor?: Date;
}

export interface ChatNotificationPayload extends NotificationPayload {
  type: 'PRIVATE_MESSAGE' | 'GROUP_MESSAGE';
  senderId: string;
  senderName: string;
  messageContent: string;
  showPreview: boolean;
  chatId?: string;
  messageId?: string;
  groupName?: string; // For group messages
}

export interface AssignmentNotificationPayload extends NotificationPayload {
  type: 'ASSIGNMENT_DEADLINE';
  data: {
    assignmentId: string;
    assignmentTitle: string;
    courseId: string;
    courseName: string;
    dueDate: string;
    timeRemaining: string;
  };
}

export interface PostNotificationPayload extends NotificationPayload {
  type: 'POST_CREATED' | 'POST_UPDATED' | 'POST_PINNED' |
        'POST_FILE_UPLOADED' | 'POST_URGENT';
  data: {
    postId: string;
    sectionId: string;
    sectionName: string;
    authorId: string;
    authorName: string;
    title: string;
    fileId?: string;
    fileName?: string;
    timeRemaining?: string;
    action: 'view_post' | 'download_file' | 'urgent_attention';
  };
}

export interface FCMMessage {
  token?: string;
  topic?: string;
  condition?: string;
  notification?: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  android?: {
    priority: 'normal' | 'high';
    notification?: {
      sound?: string;
      clickAction?: string;
      color?: string;
      icon?: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
        'content-available'?: number;
      };
    };
  };
  webpush?: {
    notification?: {
      icon?: string;
      badge?: string;
      image?: string;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    };
  };
}

export interface NotificationTemplate {
  type: NotificationType;
  title: (data: any) => string;
  body: (data: any) => string;
  data?: (data: any) => Record<string, any>;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  showMessagePreview: boolean;
  notificationSound: boolean;
  vibrate: boolean;
  privateMessagesEnabled: boolean;
  groupMessagesEnabled: boolean;
  assignmentReminders: boolean;
  courseAnnouncements: boolean;
  gradeUpdates: boolean;
  // Post-specific preferences
  postNotificationsEnabled: boolean;
  newPostsEnabled: boolean;
  postUpdatesEnabled: boolean;
  urgentPostsEnabled: boolean;
  pinnedPostsEnabled: boolean;
  fileUploadNotificationsEnabled: boolean;
  departmentPostsOnly: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface ChatNotificationSettings {
  chatId: string;
  chatType: 'private' | 'group';
  isMuted: boolean;
  mutedUntil?: Date;
}
