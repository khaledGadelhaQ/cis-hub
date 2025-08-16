import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { 
  redisConnection,
  notificationQueueConfig,
  chatAutomationQueueConfig,
  academicSyncQueueConfig,
  emailQueueConfig,
  monitoringQueueConfig,
  QueueNames
} from '../config/queue.config';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationQueueService } from './services/notification-queue.service';
import { QueueTestController } from './controllers/queue-test.controller';
import { NotificationModule } from '../modules/notifications/notification.module';

/**
 * Queue Module for CIS-HUB
 * 
 * This module sets up all the queues used throughout the application.
 * Each queue serves a specific purpose:
 * 
 * 🔔 NOTIFICATIONS Queue:
 *    - Real-time chat notifications
 *    - Push notifications via FCM
 *    - Bulk notification campaigns
 *    - Priority: HIGH (immediate processing)
 * 
 * 💬 CHAT_AUTOMATION Queue:
 *    - Automatic room creation for classes/sections
 *    - User subscription management
 *    - Topic subscription automation
 *    - Priority: NORMAL (background processing)
 * 
 * 🎓 ACADEMIC_SYNC Queue:
 *    - Bulk student enrollments
 *    - Course data synchronization
 *    - Academic calendar updates
 *    - Priority: NORMAL (reliable background processing)
 * 
 * 📧 EMAIL Queue:
 *    - Welcome emails for new users
 *    - Weekly/monthly digest emails
 *    - System notification emails
 *    - Priority: LOW (can be delayed)
 * 
 * 📊 MONITORING Queue:
 *    - System health checks
 *    - Data cleanup tasks
 *    - Analytics data collection
 *    - Priority: MAINTENANCE (least urgent)
 * 
 * Why separate queues?
 * - Different priorities and processing patterns
 * - Independent scaling and monitoring
 * - Fault isolation (one queue failure doesn't affect others)
 * - Resource allocation based on importance
 */

@Module({
  imports: [
    // Import NotificationModule to access NotificationService
    NotificationModule,
    
    // Configure BullMQ with shared Redis connection
    BullModule.forRoot({
      redis: redisConnection,
      
      // Global queue settings
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    }),

    // Register individual queues with specific configurations
    BullModule.registerQueue(
      {
        name: QueueNames.NOTIFICATIONS,
        defaultJobOptions: notificationQueueConfig.defaultJobOptions,
      },
      {
        name: QueueNames.CHAT_AUTOMATION,
        defaultJobOptions: chatAutomationQueueConfig.defaultJobOptions,
      },
      {
        name: QueueNames.ACADEMIC_SYNC,
        defaultJobOptions: academicSyncQueueConfig.defaultJobOptions,
      },
      {
        name: QueueNames.EMAIL,
        defaultJobOptions: emailQueueConfig.defaultJobOptions,
      },
      {
        name: QueueNames.MONITORING,
        defaultJobOptions: monitoringQueueConfig.defaultJobOptions,
      },
    ),
  ],
  
  // Add controllers
  controllers: [QueueTestController],
  
  // Add queue processors and services
  providers: [
    NotificationProcessor,
    NotificationQueueService,
  ],
  
  // Export services for use in other modules
  exports: [BullModule, NotificationQueueService],
})
export class QueueModule {
  /**
   * Module initialization
   * 
   * The queues are now ready to be injected into services:
   * 
   * Example usage in a service:
   * ```typescript
   * constructor(
   *   @InjectQueue('notifications') private notificationQueue: Queue,
   * ) {}
   * 
   * async sendNotification(data: any) {
   *   await this.notificationQueue.add('chat-notification', data, {
   *     priority: 10,
   *     delay: 0,
   *   });
   * }
   * ```
   */
}
