import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  platform?: string = 'android'; // android, ios, web
}

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  showMessagePreview?: boolean;

  @IsBoolean()
  @IsOptional()
  notificationSound?: boolean;

  @IsBoolean()
  @IsOptional()
  vibrate?: boolean;

  @IsBoolean()
  @IsOptional()
  privateMessagesEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  groupMessagesEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  assignmentReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  courseAnnouncements?: boolean;

  @IsBoolean()
  @IsOptional()
  gradeUpdates?: boolean;

  @IsString()
  @IsOptional()
  quietHoursStart?: string; // "22:00"

  @IsString()
  @IsOptional()
  quietHoursEnd?: string; // "07:00"
}

export class UpdateChatNotificationSettingDto {
  @IsString()
  chatId: string;

  @IsString()
  chatType: 'private' | 'group';

  @IsBoolean()
  isMuted: boolean;

  @IsDateString()
  @IsOptional()
  mutedUntil?: string;
}

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  sourceType?: string;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

export class SendChatNotificationDto {
  @IsString()
  recipientId: string;

  @IsString()
  senderId: string;

  @IsString()
  senderName: string;

  @IsString()
  messageContent: string;

  @IsString()
  chatType: 'private' | 'group';

  @IsString()
  @IsOptional()
  chatId?: string; // roomId for groups

  @IsString()
  @IsOptional()
  messageId?: string;
}

export class SendGroupNotificationDto {
  @IsString()
  groupId: string; // Room/Group ID

  @IsString()
  senderId: string;

  @IsString()
  senderName: string;

  @IsString()
  messageContent: string;

  @IsString()
  groupName: string;

  @IsString()
  @IsOptional()
  messageId?: string;
}

export class ManageTopicSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  topicName: string; // e.g., "group_123", "course_456"

  @IsBoolean()
  subscribe: boolean; // true to subscribe, false to unsubscribe
}

export class SendBulkNotificationDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class GetNotificationHistoryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  type?: NotificationType;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 50;

  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}
