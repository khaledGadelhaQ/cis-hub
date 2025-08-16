import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationType } from '@prisma/client';
import { QueueNames, JobTypes, QueuePriorities } from '../../config/queue.config';
import { 
  ChatNotificationJobDto, 
  PushNotificationJobDto, 
  BulkNotificationJobDto 
} from '../dto/queue-job.dto';

/**
 * Queue Producer Service for Notifications
 * 
 * This service provides a high-level interface for adding jobs
 * to the notification queue. Use this service in your controllers
 * and other services to trigger background notification processing.
 */
@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue(QueueNames.NOTIFICATIONS) 
    private readonly notificationQueue: Queue
  ) {}

  /**
   * Queue a chat notification for background processing
   * 
   * @param recipientId - User ID to receive the notification
   * @param messageContent - Chat message content
   * @param senderId - User ID of the message sender
   * @param senderName - Name of the message sender
   * @param chatId - Chat room ID
   * @param messageId - Unique message ID
   * @param chatType - Type of chat (private/group)
   * @param priority - Queue priority (optional, defaults to HIGH)
   */
  async queueChatNotification(
    recipientId: string,
    messageContent: string,
    senderId: string,
    senderName: string,
    chatId: string,
    messageId: string,
    chatType: 'private' | 'group' = 'private',
    priority: number = QueuePriorities.HIGH
  ): Promise<void> {
    const jobData: ChatNotificationJobDto = {
      recipientId,
      senderId,
      senderName,
      messageContent,
      chatType,
      chatId,
      messageId,
      priority,
    };

    const job = await this.notificationQueue.add(
      JobTypes.CHAT_NOTIFICATION,
      jobData,
      {
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    this.logger.debug(
      `✅ Queued chat notification job ${job.id} for user ${recipientId}`
    );
  }

  /**
   * Queue a push notification for background processing
   * 
   * @param recipientId - User ID to receive the notification
   * @param title - Notification title
   * @param body - Notification body text
   * @param data - Additional data payload (optional)
   * @param priority - Queue priority (optional, defaults to NORMAL)
   */
  async queuePushNotification(
    recipientId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    priority: number = QueuePriorities.NORMAL
  ): Promise<void> {
    const jobData: PushNotificationJobDto = {
      recipientId,
      title,
      body,
      data,
    };

    const job = await this.notificationQueue.add(
      JobTypes.PUSH_NOTIFICATION,
      jobData,
      {
        priority,
        attempts: 2,
        delay: 1000, // 1 second delay to batch similar notifications
      }
    );

    this.logger.debug(
      `✅ Queued push notification job ${job.id} for user ${recipientId}: "${title}"`
    );
  }

  /**
   * Queue a bulk notification campaign for background processing
   * 
   * @param recipientIds - Array of user IDs to receive the notification
   * @param title - Notification title
   * @param body - Notification body text
   * @param type - Type of notification (from Prisma enum)
   * @param priority - Queue priority (optional, defaults to LOW for bulk)
   * @param batchSize - Number of notifications to process per batch
   */
  async queueBulkNotification(
    recipientIds: string[],
    title: string,
    body: string,
    type: NotificationType,
    priority: number = QueuePriorities.LOW,
    batchSize: number = 100
  ): Promise<void> {
    const jobData: BulkNotificationJobDto = {
      notifications: recipientIds.map(recipientId => ({
        recipientId,
        title,
        body,
        data: { type },
      })),
      batchSize,
    };

    const job = await this.notificationQueue.add(
      JobTypes.BULK_NOTIFICATIONS, // Fixed: was BULK_NOTIFICATION
      jobData,
      {
        priority,
        attempts: 1, // Bulk jobs are less critical
        delay: 5000, // 5 second delay for bulk processing
      }
    );

    this.logger.log(
      `✅ Queued bulk notification job ${job.id} for ${recipientIds.length} recipients: "${title}"`
    );
  }

  /**
   * Get queue statistics and health information
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.notificationQueue.getWaiting(),
      this.notificationQueue.getActive(),
      this.notificationQueue.getCompleted(),
      this.notificationQueue.getFailed(),
      this.notificationQueue.getDelayed(),
    ]);

    return {
      queueName: QueueNames.NOTIFICATIONS,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      health: {
        isHealthy: failed.length < waiting.length * 0.1, // < 10% failure rate
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  /**
   * Clear failed jobs from the queue (maintenance operation)
   */
  async clearFailedJobs(): Promise<number> {
    const failedJobs = await this.notificationQueue.getFailed();
    const count = failedJobs.length;
    
    await this.notificationQueue.clean(0, 'failed');
    
    this.logger.warn(`🧹 Cleared ${count} failed notification jobs`);
    return count;
  }

  /**
   * Pause the notification queue (emergency operation)
   */
  async pauseQueue(): Promise<void> {
    await this.notificationQueue.pause();
    this.logger.warn(`⏸️  Notification queue paused`);
  }

  /**
   * Resume the notification queue
   */
  async resumeQueue(): Promise<void> {
    await this.notificationQueue.resume();
    this.logger.log(`▶️  Notification queue resumed`);
  }
}
