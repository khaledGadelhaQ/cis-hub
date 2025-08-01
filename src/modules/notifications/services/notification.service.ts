import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FCMService } from './fcm.service';
import { 
  NotificationType, 
  NotificationPayload, 
  ChatNotificationPayload, 
  NotificationTemplate 
} from '../interfaces/notification.interface';
import { 
  SendChatNotificationDto, 
  RegisterDeviceTokenDto, 
  UpdateNotificationPreferencesDto,
  UpdateChatNotificationSettingDto,
  SendGroupNotificationDto,
  ManageTopicSubscriptionDto
} from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notificationTemplates: Map<NotificationType, NotificationTemplate> = new Map();

  constructor(
    private prisma: PrismaService,
    private fcmService: FCMService,
  ) {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Private message template
    this.notificationTemplates.set(NotificationType.PRIVATE_MESSAGE, {
      type: NotificationType.PRIVATE_MESSAGE,
      title: (data) => `New message from ${data.senderName}`,
      body: (data) => data.showPreview ? data.messagePreview : 'You have a new message',
      data: (data) => ({
        senderId: data.senderId,
        chatId: data.chatId,
        chatType: 'private',
        messageId: data.messageId,
        action: 'open_chat',
      }),
    });

    // Group message template
    this.notificationTemplates.set(NotificationType.GROUP_MESSAGE, {
      type: NotificationType.GROUP_MESSAGE,
      title: (data) => `${data.senderName} in ${data.groupName}`,
      body: (data) => data.showPreview ? data.messagePreview : 'New group message',
      data: (data) => ({
        senderId: data.senderId,
        chatId: data.chatId,
        chatType: 'group',
        messageId: data.messageId,
        action: 'open_chat',
      }),
    });

    // Assignment deadline template
    this.notificationTemplates.set(NotificationType.ASSIGNMENT_DEADLINE, {
      type: NotificationType.ASSIGNMENT_DEADLINE,
      title: (data) => `Assignment Due: ${data.assignmentTitle}`,
      body: (data) => `Due in ${data.timeRemaining} for ${data.courseName}`,
      data: (data) => ({
        assignmentId: data.assignmentId,
        courseId: data.courseId,
        action: 'open_assignment',
      }),
    });
  }

  // ================================
  // DEVICE TOKEN MANAGEMENT
  // ================================

  async registerDeviceToken(userId: string, tokenData: RegisterDeviceTokenDto): Promise<void> {
    try {
      // Validate token with FCM first
      const isValid = await this.fcmService.validateToken(tokenData.token);
      if (!isValid) {
        this.logger.warn(`Invalid FCM token provided for user ${userId}`);
        throw new Error('Invalid FCM token');
      }

      // Upsert device token (since one user = one session)
      await this.prisma.deviceToken.upsert({
        where: { userId },
        update: {
          token: tokenData.token,
          platform: tokenData.platform,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          token: tokenData.token,
          platform: tokenData.platform,
          isActive: true,
        },
      });

      this.logger.log(`Device token registered for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to register device token for user ${userId}:`, error.message);
      throw error;
    }
  }

  async removeDeviceToken(userId: string): Promise<void> {
    try {
      await this.prisma.deviceToken.delete({
        where: { userId },
      });
      this.logger.log(`Device token removed for user ${userId}`);
    } catch (error) {
      this.logger.warn(`Failed to remove device token for user ${userId}:`, error.message);
    }
  }

  async markTokenAsInactive(userId: string): Promise<void> {
    try {
      await this.prisma.deviceToken.update({
        where: { userId },
        data: { isActive: false },
      });
    } catch (error) {
      this.logger.warn(`Failed to mark token as inactive for user ${userId}`);
    }
  }

  // ================================
  // NOTIFICATION PREFERENCES
  // ================================

  async getNotificationPreferences(userId: string) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Return default preferences if none exist
    if (!preferences) {
      return {
        notificationsEnabled: true,
        showMessagePreview: true,
        notificationSound: true,
        vibrate: true,
        privateMessagesEnabled: true,
        groupMessagesEnabled: true,
        assignmentReminders: true,
        courseAnnouncements: true,
        gradeUpdates: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      };
    }

    return preferences;
  }

  async updateNotificationPreferences(
    userId: string, 
    preferences: UpdateNotificationPreferencesDto
  ): Promise<void> {
    try {
      await this.prisma.notificationPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences,
        },
      });

      this.logger.log(`Notification preferences updated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update notification preferences for user ${userId}:`, error.message);
      throw error;
    }
  }

  // ================================
  // CHAT NOTIFICATION SETTINGS
  // ================================

  async updateChatNotificationSetting(
    userId: string,
    setting: UpdateChatNotificationSettingDto
  ): Promise<void> {
    try {
      await this.prisma.chatNotificationSetting.upsert({
        where: {
          userId_chatId_chatType: {
            userId,
            chatId: setting.chatId,
            chatType: setting.chatType,
          },
        },
        update: {
          isMuted: setting.isMuted,
          mutedUntil: setting.mutedUntil ? new Date(setting.mutedUntil) : null,
        },
        create: {
          userId,
          chatId: setting.chatId,
          chatType: setting.chatType,
          isMuted: setting.isMuted,
          mutedUntil: setting.mutedUntil ? new Date(setting.mutedUntil) : null,
        },
      });

      this.logger.log(`Chat notification setting updated for user ${userId}, chat ${setting.chatId}`);
    } catch (error) {
      this.logger.error(`Failed to update chat notification setting:`, error.message);
      throw error;
    }
  }

  async isChatMuted(userId: string, chatId: string, chatType: 'private' | 'group'): Promise<boolean> {
    try {
      const setting = await this.prisma.chatNotificationSetting.findUnique({
        where: {
          userId_chatId_chatType: {
            userId,
            chatId,
            chatType,
          },
        },
      });

      if (!setting) return false;

      // Check if muted and if mute period hasn't expired
      if (setting.isMuted) {
        if (setting.mutedUntil && setting.mutedUntil < new Date()) {
          // Mute period expired, unmute automatically
          await this.updateChatNotificationSetting(userId, {
            chatId,
            chatType,
            isMuted: false,
          });
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to check if chat is muted:`, error.message);
      return false;
    }
  }

  // ================================
  // TOPIC SUBSCRIPTION MANAGEMENT
  // ================================

  async subscribeToTopic(userId: string, topicName: string): Promise<void> {
    try {
      const deviceToken = await this.prisma.deviceToken.findUnique({
        where: { userId, isActive: true },
      });

      if (!deviceToken) {
        this.logger.warn(`No active device token for user ${userId} to subscribe to topic ${topicName}`);
        return;
      }

      await this.fcmService.subscribeToTopic([deviceToken.token], topicName);
      this.logger.log(`User ${userId} subscribed to topic ${topicName}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to topic ${topicName}:`, error.message);
      throw error;
    }
  }

  async unsubscribeFromTopic(userId: string, topicName: string): Promise<void> {
    try {
      const deviceToken = await this.prisma.deviceToken.findUnique({
        where: { userId, isActive: true },
      });

      if (!deviceToken) {
        this.logger.warn(`No active device token for user ${userId} to unsubscribe from topic ${topicName}`);
        return;
      }

      await this.fcmService.unsubscribeFromTopic([deviceToken.token], topicName);
      this.logger.log(`User ${userId} unsubscribed from topic ${topicName}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe user ${userId} from topic ${topicName}:`, error.message);
      throw error;
    }
  }

  async manageTopicSubscription(data: ManageTopicSubscriptionDto): Promise<void> {
    if (data.subscribe) {
      await this.subscribeToTopic(data.userId, data.topicName);
    } else {
      await this.unsubscribeFromTopic(data.userId, data.topicName);
    }
  }

  // ================================
  // CORE NOTIFICATION SENDING
  // ================================

  async sendGroupNotification(data: SendGroupNotificationDto): Promise<void> {
    try {
      const topicName = `group_${data.groupId}`;
      
      // Prepare notification content
      const template = this.notificationTemplates.get(NotificationType.GROUP_MESSAGE);
      if (!template) {
        this.logger.error(`No template found for notification type: ${NotificationType.GROUP_MESSAGE}`);
        return;
      }

      const templateData = {
        senderName: data.senderName,
        messagePreview: this.truncateMessage(data.messageContent),
        showPreview: true, // Topic notifications always show preview since we can't check individual preferences
        senderId: data.senderId,
        chatId: data.groupId,
        messageId: data.messageId || '',
        groupName: data.groupName,
      };

      const title = template.title(templateData);
      const body = template.body(templateData);
      const notificationData = template.data ? template.data(templateData) : {};

      // Send FCM notification to topic
      const fcmMessageId = await this.fcmService.sendToTopic(
        topicName,
        { title, body },
        this.convertToStringData(notificationData),
      );

      // Save notification to database (we can't save per-user for topics)
      await this.saveTopicNotification({
        type: NotificationType.GROUP_MESSAGE,
        title,
        body,
        data: templateData,
        sourceId: data.messageId || '',
        sourceType: 'group_message',
        topicName,
      }, fcmMessageId);

      this.logger.log(`Group notification sent to topic ${topicName}`);
    } catch (error) {
      this.logger.error(`Failed to send group notification:`, error.message);
    }
  }

  async sendChatNotification(data: SendChatNotificationDto): Promise<void> {
    try {
      // Check if user has notifications enabled
      const preferences = await this.getNotificationPreferences(data.recipientId);
      if (!preferences.notificationsEnabled) {
        this.logger.log(`Notifications disabled for user ${data.recipientId}`);
        return;
      }

      // Check notification type preferences
      if (data.chatType === 'private' && !preferences.privateMessagesEnabled) {
        this.logger.log(`Private message notifications disabled for user ${data.recipientId}`);
        return;
      }

      if (data.chatType === 'group' && !preferences.groupMessagesEnabled) {
        this.logger.log(`Group message notifications disabled for user ${data.recipientId}`);
        return;
      }

      // Check if specific chat is muted
      const chatId = data.chatId || data.senderId; // Use senderId for private chats
      const isMuted = await this.isChatMuted(data.recipientId, chatId, data.chatType);
      if (isMuted) {
        this.logger.log(`Chat ${chatId} is muted for user ${data.recipientId}`);
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences.quietHoursStart || undefined, preferences.quietHoursEnd || undefined)) {
        this.logger.log(`In quiet hours, skipping notification for user ${data.recipientId}`);
        return;
      }

      // Get device token
      const deviceToken = await this.prisma.deviceToken.findUnique({
        where: { userId: data.recipientId, isActive: true },
      });

      if (!deviceToken) {
        this.logger.log(`No active device token for user ${data.recipientId}`);
        return;
      }

      // Prepare notification content
      const notificationType = data.chatType === 'private' 
        ? NotificationType.PRIVATE_MESSAGE 
        : NotificationType.GROUP_MESSAGE;

      const template = this.notificationTemplates.get(notificationType);
      if (!template) {
        this.logger.error(`No template found for notification type: ${notificationType}`);
        return;
      }

      const templateData = {
        senderName: data.senderName,
        messagePreview: preferences.showMessagePreview ? this.truncateMessage(data.messageContent) : '',
        showPreview: preferences.showMessagePreview,
        senderId: data.senderId,
        chatId,
        messageId: data.messageId,
        groupName: data.chatType === 'group' ? 'Group Chat' : '', // TODO: Get actual group name
      };

      const title = template.title(templateData);
      const body = template.body(templateData);
      const notificationData = template.data ? template.data(templateData) : {};

      // Send FCM notification
      const fcmMessageId = await this.fcmService.sendToToken(
        deviceToken.token,
        { title, body },
        this.convertToStringData(notificationData),
      );

      // Save notification to database
      await this.saveNotification({
        userId: data.recipientId,
        type: notificationType,
        title,
        body,
        data: templateData,
        sourceId: data.messageId,
        sourceType: 'message',
      }, fcmMessageId);

      this.logger.log(`Chat notification sent to user ${data.recipientId}`);
    } catch (error) {
      this.logger.error(`Failed to send chat notification:`, error.message);
      
      // Handle invalid token
      if (error.message === 'INVALID_TOKEN') {
        await this.markTokenAsInactive(data.recipientId);
      }
    }
  }

  private async saveNotification(
    payload: NotificationPayload, 
    fcmMessageId: string | null
  ): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sourceId: payload.sourceId,
          sourceType: payload.sourceType,
          fcmMessageId,
          status: fcmMessageId ? 'SENT' : 'FAILED',
          sentAt: fcmMessageId ? new Date() : null,
          scheduledFor: payload.scheduledFor,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save notification to database:', error.message);
    }
  }

  private async saveTopicNotification(
    payload: Omit<NotificationPayload, 'userId'> & { topicName: string }, 
    fcmMessageId: string | null
  ): Promise<void> {
    try {
      // For topic notifications, we create a system notification record
      // Using a special system user ID for topic notifications
      const systemUserId = 'system'; // You might want to create a system user in your database
      
      await this.prisma.notification.create({
        data: {
          userId: systemUserId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: { ...payload.data, topicName: payload.topicName, isTopicNotification: true },
          sourceId: payload.sourceId,
          sourceType: payload.sourceType,
          fcmMessageId,
          status: fcmMessageId ? 'SENT' : 'FAILED',
          sentAt: fcmMessageId ? new Date() : null,
          scheduledFor: payload.scheduledFor,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save topic notification to database:', error.message);
    }
  }

  private truncateMessage(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  private convertToStringData(data: Record<string, any>): Record<string, string> {
    const stringData: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    return stringData;
  }

  private isInQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }
}
