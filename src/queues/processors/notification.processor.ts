import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../../modules/notifications/services/notification.service';
import { 
  ChatNotificationJobDto, 
  PushNotificationJobDto, 
  BulkNotificationJobDto,
  JobResultDto 
} from '../dto/queue-job.dto';
import { JobTypes, QueueNames } from '../../config/queue.config';

/**
 * Notification Queue Processor
 * 
 * Processes all notification-related background jobs:
 * - Chat notifications (real-time messaging)
 * - Push notifications (FCM)
 * - Bulk notification campaigns
 * 
 * This processor handles the heavy lifting of sending notifications
 * so the main API can respond immediately to user actions.
 */

@Injectable()
@Processor(QueueNames.NOTIFICATIONS)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Process chat notifications
   * 
   * This is triggered when users send messages in chat rooms.
   * Instead of blocking the chat API response, notifications are
   * sent in the background with automatic retry handling.
   */
  @Process(JobTypes.CHAT_NOTIFICATION)
  async processChatNotification(job: Job<ChatNotificationJobDto>): Promise<JobResultDto> {
    const startTime = Date.now();
    const { data } = job;
    
    this.logger.debug(`Processing chat notification for user ${data.recipientId} from ${data.senderId}`);

    try {
      // Send the notification using existing service
      await this.notificationService.sendChatNotification(data);

      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `✅ Chat notification sent successfully to ${data.recipientId} ` +
        `(${processingTime}ms, attempt ${job.attemptsMade + 1}/${job.opts.attempts})`
      );

      return {
        success: true,
        data: {
          recipientId: data.recipientId,
          messageId: data.messageId,
          deliveredAt: new Date().toISOString(),
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTime,
          attempts: job.attemptsMade + 1,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
      
      this.logger.error(
        `❌ Failed to send chat notification to ${data.recipientId}: ${error.message} ` +
        `(attempt ${job.attemptsMade + 1}/${job.opts.attempts})`
      );

      // If this is the last attempt, log the final failure
      if (isLastAttempt) {
        this.logger.error(
          `🔥 FINAL FAILURE: Chat notification to ${data.recipientId} failed after all attempts`
        );
        
        // Optionally notify administrators about persistent failures
        // await this.notifyAdminsOfPersistentFailure(data, error);
      }

      return {
        success: false,
        error: error.message,
        metadata: {
          processedAt: new Date().toISOString(),
          processingTime,
          attempts: job.attemptsMade + 1,
          isLastAttempt,
        },
      };
    }
  }

  /**
   * Process general push notifications
   * 
   * Handles system notifications, announcements, etc.
   * Less critical than chat notifications but still important.
   */
  @Process(JobTypes.PUSH_NOTIFICATION)
  async processPushNotification(job: Job<PushNotificationJobDto>): Promise<JobResultDto> {
    const startTime = Date.now();
    const { data } = job;
    
    this.logger.debug(`Processing push notification for user ${data.recipientId}: ${data.title}`);

    try {
      // Send generic notification
      await this.notificationService.sendNotification({
        recipientId: data.recipientId,
        type: NotificationType.SYSTEM_ALERT, // System notifications
        templateData: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          imageUrl: data.imageUrl,
          clickAction: data.clickAction,
        },
      });

      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `✅ Push notification sent successfully to ${data.recipientId}: "${data.title}" ` +
        `(${processingTime}ms)`
      );

      return {
        success: true,
        data: {
          recipientId: data.recipientId,
          title: data.title,
          deliveredAt: new Date().toISOString(),
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTime,
          attempts: job.attemptsMade + 1,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(
        `❌ Failed to send push notification to ${data.recipientId}: ${error.message}`
      );

      throw error; // Let Bull handle the retry logic
    }
  }

  /**
   * Process bulk notifications
   * 
   * Handles mass notification campaigns, system announcements, etc.
   * Processes notifications in batches to avoid overwhelming the FCM service.
   */
  @Process(JobTypes.BULK_NOTIFICATIONS)
  async processBulkNotifications(job: Job<BulkNotificationJobDto>): Promise<JobResultDto> {
    const startTime = Date.now();
    const { notifications, batchSize = 100 } = job.data;
    
    this.logger.log(`Processing bulk notifications: ${notifications.length} recipients`);

    const results = {
      total: notifications.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ recipientId: string; error: string }>,
    };

    // Process in batches to avoid overwhelming the system
    const batches = this.chunkArray(notifications, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      this.logger.debug(`Processing batch ${batchNumber}/${batches.length} (${batch.length} notifications)`);

      // Update job progress
      const progress = (i / batches.length) * 100;
      await job.progress(Math.round(progress));

      // Process batch with some concurrency but not too much
      const batchPromises = batch.map(async (notification) => {
        try {
          await this.notificationService.sendNotification({
            recipientId: notification.recipientId,
            type: NotificationType.SYSTEM_ALERT,
            templateData: {
              title: notification.title,
              body: notification.body,
              data: notification.data || {},
            },
          });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            recipientId: notification.recipientId,
            error: error.message,
          });
          this.logger.warn(`Failed to send bulk notification to ${notification.recipientId}: ${error.message}`);
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches to be nice to external services
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final progress update
    await job.progress(100);

    const processingTime = Date.now() - startTime;
    const successRate = (results.successful / results.total) * 100;

    this.logger.log(
      `✅ Bulk notifications completed: ${results.successful}/${results.total} successful ` +
      `(${successRate.toFixed(1)}% success rate, ${processingTime}ms)`
    );

    return {
      success: results.failed === 0,
      data: results,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTime,
        attempts: job.attemptsMade + 1,
        successRate,
      },
    };
  }

  /**
   * Global error handler for the notification queue
   * 
   * This catches any unhandled errors in the queue processing
   */
  @Process()
  async handleFailedJob(job: Job): Promise<void> {
    this.logger.error(
      `🔥 Unhandled job failure in notification queue: ${job.name} ` +
      `(Job ID: ${job.id}, Attempts: ${job.attemptsMade})`
    );
    
    // Log job data for debugging (be careful with sensitive data)
    this.logger.error('Failed job data:', {
      jobId: job.id,
      jobName: job.name,
      attempts: job.attemptsMade,
      // Don't log full data in production to avoid sensitive info in logs
      dataKeys: Object.keys(job.data || {}),
    });
  }

  /**
   * Utility method to chunk arrays into batches
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Optional: Notify administrators about persistent notification failures
   * This could send an internal alert when notifications consistently fail
   */
  private async notifyAdminsOfPersistentFailure(
    notificationData: ChatNotificationJobDto, 
    error: Error
  ): Promise<void> {
    // Implementation depends on your admin notification system
    // Could send email, Slack message, or internal notification
    this.logger.error(
      `🚨 ADMIN ALERT: Persistent notification failure for user ${notificationData.recipientId}`,
      {
        recipientId: notificationData.recipientId,
        senderId: notificationData.senderId,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
