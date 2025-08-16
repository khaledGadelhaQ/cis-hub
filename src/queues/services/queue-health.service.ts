import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueNames } from '../../config/queue.config';

/**
 * Queue Health Check Service
 * 
 * Provides methods to check the health and status of all queues.
 * This is useful for monitoring and debugging queue issues.
 */

@Injectable()
export class QueueHealthService {
  private readonly logger = new Logger(QueueHealthService.name);

  constructor(
    @InjectQueue(QueueNames.NOTIFICATIONS) private notificationQueue: Queue,
    @InjectQueue(QueueNames.CHAT_AUTOMATION) private chatAutomationQueue: Queue,
    @InjectQueue(QueueNames.ACADEMIC_SYNC) private academicSyncQueue: Queue,
    @InjectQueue(QueueNames.EMAIL) private emailQueue: Queue,
    @InjectQueue(QueueNames.MONITORING) private monitoringQueue: Queue,
  ) {}

  /**
   * Get health status of all queues
   */
  async getQueueHealthStatus() {
    const queues = [
      { name: QueueNames.NOTIFICATIONS, queue: this.notificationQueue },
      { name: QueueNames.CHAT_AUTOMATION, queue: this.chatAutomationQueue },
      { name: QueueNames.ACADEMIC_SYNC, queue: this.academicSyncQueue },
      { name: QueueNames.EMAIL, queue: this.emailQueue },
      { name: QueueNames.MONITORING, queue: this.monitoringQueue },
    ];

    const healthStatus = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed(),
          ]);

          return {
            name,
            status: 'healthy',
            counts: {
              waiting: waiting.length,
              active: active.length,
              completed: completed.length,
              failed: failed.length,
              delayed: delayed.length,
            },
            isHealthy: failed.length < 10, // Consider unhealthy if >10 failed jobs
          };
        } catch (error) {
          this.logger.error(`Failed to get health status for queue ${name}:`, error);
          return {
            name,
            status: 'error',
            error: error.message,
            isHealthy: false,
          };
        }
      })
    );

    const overallHealth = healthStatus.every(queue => queue.isHealthy);

    return {
      timestamp: new Date().toISOString(),
      overallHealth,
      queues: healthStatus,
      summary: {
        totalQueues: queues.length,
        healthyQueues: healthStatus.filter(q => q.isHealthy).length,
        unhealthyQueues: healthStatus.filter(q => !q.isHealthy).length,
      },
    };
  }

  /**
   * Get detailed statistics for a specific queue
   */
  async getQueueStatistics(queueName: string) {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      queueName,
      timestamp: new Date().toISOString(),
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      jobs: {
        waiting: waiting.slice(0, 5).map(this.formatJobSummary),
        active: active.slice(0, 5).map(this.formatJobSummary),
        failed: failed.slice(0, 5).map(this.formatJobSummary),
      },
    };
  }

  /**
   * Clear failed jobs from a queue (maintenance function)
   */
  async clearFailedJobs(queueName: string): Promise<number> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failedJobs = await queue.getFailed();
    await queue.clean(0, 'failed');
    
    this.logger.log(`Cleared ${failedJobs.length} failed jobs from queue ${queueName}`);
    return failedJobs.length;
  }

  /**
   * Pause/Resume queue processing
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  /**
   * Private helper methods
   */
  private getQueueByName(name: string): Queue | null {
    switch (name) {
      case QueueNames.NOTIFICATIONS:
        return this.notificationQueue;
      case QueueNames.CHAT_AUTOMATION:
        return this.chatAutomationQueue;
      case QueueNames.ACADEMIC_SYNC:
        return this.academicSyncQueue;
      case QueueNames.EMAIL:
        return this.emailQueue;
      case QueueNames.MONITORING:
        return this.monitoringQueue;
      default:
        return null;
    }
  }

  private formatJobSummary(job: any) {
    return {
      id: job.id,
      name: job.name,
      data: Object.keys(job.data || {}),
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
    };
  }
}
