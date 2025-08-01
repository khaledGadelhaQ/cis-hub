// Notification Types and Interfaces

export enum NotificationType {
  PRIVATE_MESSAGE = 'PRIVATE_MESSAGE',
  GROUP_MESSAGE = 'GROUP_MESSAGE',
  ASSIGNMENT_DEADLINE = 'ASSIGNMENT_DEADLINE',
  COURSE_ANNOUNCEMENT = 'COURSE_ANNOUNCEMENT',
  GRADE_UPDATE = 'GRADE_UPDATE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

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
  type: NotificationType.PRIVATE_MESSAGE | NotificationType.GROUP_MESSAGE;
  data: {
    senderId: string;
    senderName: string;
    chatId: string;
    chatType: 'private' | 'group';
    messageId: string;
    messagePreview?: string;
  };
}

export interface AssignmentNotificationPayload extends NotificationPayload {
  type: NotificationType.ASSIGNMENT_DEADLINE;
  data: {
    assignmentId: string;
    assignmentTitle: string;
    courseId: string;
    courseName: string;
    dueDate: string;
    timeRemaining: string;
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
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface ChatNotificationSettings {
  chatId: string;
  chatType: 'private' | 'group';
  isMuted: boolean;
  mutedUntil?: Date;
}
