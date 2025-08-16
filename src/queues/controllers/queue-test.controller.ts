import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { NotificationQueueService } from '../services/notification-queue.service';
import { NotificationType } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Queue Test Controller
 * 
 * This controller provides endpoints to test the notification queue functionality.
 * Use these endpoints to verify that jobs are being queued and processed correctly.
 * 
 * ⚠️  NOTE: This is for testing purposes only. 
 * Remove or secure these endpoints in production!
 * 
 * 🔓 Authentication is disabled for testing purposes
 */
@Public()
@Controller('queue-test')
export class QueueTestController {
  constructor(
    private readonly notificationQueueService: NotificationQueueService
  ) {}

  /**
   * Test chat notification queuing
   * POST /queue-test/chat-notification
   */
  @Post('chat-notification')
  async testChatNotification(@Body() body: {
    recipientId: string;
    messageContent: string;
    senderId: string;
    senderName: string;
    chatId: string;
    messageId: string;
    chatType?: 'private' | 'group';
  }) {
    await this.notificationQueueService.queueChatNotification(
      body.recipientId,
      body.messageContent,
      body.senderId,
      body.senderName,
      body.chatId,
      body.messageId,
      body.chatType || 'private'
    );

    return {
      success: true,
      message: 'Chat notification queued successfully',
      data: body,
    };
  }

  /**
   * Test push notification queuing
   * POST /queue-test/push-notification
   */
  @Post('push-notification')
  async testPushNotification(@Body() body: {
    recipientId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    await this.notificationQueueService.queuePushNotification(
      body.recipientId,
      body.title,
      body.body,
      body.data
    );

    return {
      success: true,
      message: 'Push notification queued successfully',
      data: body,
    };
  }

  /**
   * Test bulk notification queuing
   * POST /queue-test/bulk-notification
   */
  @Post('bulk-notification')
  async testBulkNotification(@Body() body: {
    recipientIds: string[];
    title: string;
    body: string;
    type?: NotificationType;
  }) {
    await this.notificationQueueService.queueBulkNotification(
      body.recipientIds,
      body.title,
      body.body,
      body.type || NotificationType.SYSTEM_ALERT
    );

    return {
      success: true,
      message: 'Bulk notification queued successfully',
      data: {
        recipientCount: body.recipientIds.length,
        title: body.title,
        type: body.type || NotificationType.SYSTEM_ALERT,
      },
    };
  }

  /**
   * Get queue statistics
   * GET /queue-test/stats
   */
  @Get('stats')
  async getQueueStats() {
    const stats = await this.notificationQueueService.getQueueStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Clear failed jobs (maintenance endpoint)
   * POST /queue-test/clear-failed
   */
  @Post('clear-failed')
  async clearFailedJobs() {
    const clearedCount = await this.notificationQueueService.clearFailedJobs();
    return {
      success: true,
      message: `Cleared ${clearedCount} failed jobs`,
      clearedCount,
    };
  }

  /**
   * Pause the notification queue
   * POST /queue-test/pause
   */
  @Post('pause')
  async pauseQueue() {
    await this.notificationQueueService.pauseQueue();
    return {
      success: true,
      message: 'Notification queue paused',
    };
  }

  /**
   * Resume the notification queue
   * POST /queue-test/resume
   */
  @Post('resume')
  async resumeQueue() {
    await this.notificationQueueService.resumeQueue();
    return {
      success: true,
      message: 'Notification queue resumed',
    };
  }
}
