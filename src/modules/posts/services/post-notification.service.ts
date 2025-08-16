import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationQueueService } from '../../../queues/services/notification-queue.service'; // 🆕 Queue integration
import { 
  PostNotificationPayload 
} from '../../notifications/interfaces/notification.interface';
import { PostScope } from '../../../common/enums/post_scope.enum';
import { PostType } from '../../../common/enums/post_type.enum';
import { Priority } from '../../../common/enums/priority.enum';
import { UserRole } from '../../../common/enums/user_role.enum';

export interface PostCreatedEvent {
  postId: string;
  authorId: string;
  departmentId?: string;
  postType: PostType;
  scope: PostScope;
  targetYear?: number;
  priority: Priority;
  title: string;
}

export interface PostUpdatedEvent {
  postId: string;
  authorId: string;
  departmentId?: string;
  updatedFields: string[];
  title: string;
}

export interface PostFileUploadedEvent {
  postId: string;
  authorId: string;
  fileCount: number;
  fileNames: string[];
  title: string;
}

export interface PostPinnedEvent {
  postId: string;
  authorId: string;
  departmentId?: string;
  isPinned: boolean;
  title: string;
}

@Injectable()
export class PostNotificationService {
  private readonly logger = new Logger(PostNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly notificationQueueService: NotificationQueueService, // 🆕 Queue integration
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Handle post creation events
   */
  @OnEvent('post.created')
  async handlePostCreated(event: PostCreatedEvent) {
    this.logger.log(`Processing post created event for post ${event.postId}`);

    try {
      // Get post author information
      const author = await this.getAuthorInfo(event.authorId);
      if (!author) return;

      // Get target users based on post scope and department
      const targetUsers = await this.getTargetUsers(event);

      // Determine notification type based on post priority and type
      const notificationType = this.getNotificationTypeForPost(event);

      // Send notifications to all target users
      await this.sendNotificationsToUsers(
        targetUsers,
        notificationType,
        {
          postId: event.postId,
          sectionId: event.departmentId || '',
          sectionName: author.department?.name || 'General',
          authorId: event.authorId,
          authorName: `${author.firstName} ${author.lastName}`,
          title: event.title,
          action: 'view_post',
        }
      );

      this.logger.log(`Sent post creation notifications to ${targetUsers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to process post created event: ${error.message}`);
    }
  }

  /**
   * Handle post update events
   */
  @OnEvent('post.updated')
  async handlePostUpdated(event: PostUpdatedEvent) {
    this.logger.log(`Processing post updated event for post ${event.postId}`);

    try {
      const author = await this.getAuthorInfo(event.authorId);
      if (!author) return;

      // Only notify for significant updates (not minor edits)
      const significantFields = ['postType', 'priority', 'scope', 'departmentId'];
      const hasSignificantUpdate = event.updatedFields.some(field => 
        significantFields.includes(field)
      );

      if (!hasSignificantUpdate) return;

      // Get subscribers who have interacted with this post
      const subscribers = await this.getPostSubscribers(event.postId);

      await this.sendNotificationsToUsers(
        subscribers,
        NotificationType.POST_UPDATED,
        {
          postId: event.postId,
          sectionId: event.departmentId || '',
          sectionName: author.department?.name || 'General',
          authorId: event.authorId,
          authorName: `${author.firstName} ${author.lastName}`,
          title: event.title,
          action: 'view_post',
        }
      );

      this.logger.log(`Sent post update notifications to ${subscribers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to process post updated event: ${error.message}`);
    }
  }

  /**
   * Handle file upload events
   */
  @OnEvent('post.file.uploaded')
  async handlePostFileUploaded(event: PostFileUploadedEvent) {
    this.logger.log(`Processing file uploaded event for post ${event.postId}`);

    try {
      const author = await this.getAuthorInfo(event.authorId);
      if (!author) return;

      // Get subscribers to this post
      const subscribers = await this.getPostSubscribers(event.postId);

      await this.sendNotificationsToUsers(
        subscribers,
        NotificationType.POST_FILE_UPLOADED,
        {
          postId: event.postId,
          sectionId: author.department?.id || '',
          sectionName: author.department?.name || 'General',
          authorId: event.authorId,
          authorName: `${author.firstName} ${author.lastName}`,
          title: event.title,
          fileName: event.fileNames.join(', '),
          action: 'download_file',
        }
      );

      this.logger.log(`Sent file upload notifications to ${subscribers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to process file upload event: ${error.message}`);
    }
  }

  /**
   * Handle post pinned/unpinned events
   */
  @OnEvent('post.pinned')
  async handlePostPinned(event: PostPinnedEvent) {
    if (!event.isPinned) return; // Only notify when pinned, not unpinned

    this.logger.log(`Processing post pinned event for post ${event.postId}`);

    try {
      const author = await this.getAuthorInfo(event.authorId);
      if (!author) return;

      // Get all users in the department for pinned posts
      const departmentUsers = await this.getDepartmentUsers(event.departmentId);

      await this.sendNotificationsToUsers(
        departmentUsers,
        NotificationType.POST_PINNED,
        {
          postId: event.postId,
          sectionId: event.departmentId || '',
          sectionName: author.department?.name || 'General',
          authorId: event.authorId,
          authorName: `${author.firstName} ${author.lastName}`,
          title: event.title,
          action: 'view_post',
        }
      );

      this.logger.log(`Sent pinned post notifications to ${departmentUsers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to process post pinned event: ${error.message}`);
    }
  }

  /**
   * Send digest notifications for daily/weekly summaries
   */
  async sendPostDigest(userId: string, period: 'daily' | 'weekly') {
    this.logger.log(`Sending ${period} post digest to user ${userId}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { department: true },
      });

      if (!user) return;

      const timeRange = this.getTimeRangeForPeriod(period);
      
      // Get recent posts relevant to the user
      const recentPosts = await this.prisma.post.findMany({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
          OR: [
            { scope: PostScope.GLOBAL },
            { 
              AND: [
                { scope: PostScope.DEPARTMENT },
                { departmentId: user.departmentId },
              ],
            },
            {
              AND: [
                { scope: PostScope.YEAR },
                { targetYear: user.currentYear },
              ],
            },
          ],
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10, // Limit to top 10 posts
      });

      if (recentPosts.length === 0) return;

      // Create digest notification
      const digestTitle = `${period.charAt(0).toUpperCase() + period.slice(1)} Posts Digest`;
      const digestBody = `${recentPosts.length} new posts in your department`;

      await this.notificationService.sendNotification({
        recipientId: user.id,
        type: NotificationType.POST_CREATED, // Reuse existing type
        templateData: {
          postId: '',
          sectionId: user.departmentId || '',
          sectionName: user.department?.name || 'General',
          authorId: '',
          authorName: 'System',
          title: `${recentPosts.length} new posts in your department`,
          action: 'view_post',
        },
        sourceId: 'digest',
        sourceType: 'digest',
      });

      this.logger.log(`Sent ${period} digest with ${recentPosts.length} posts to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send post digest: ${error.message}`);
    }
  }

  // Private helper methods

  private async getAuthorInfo(authorId: string) {
    return this.prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  private async getTargetUsers(event: PostCreatedEvent): Promise<string[]> {
    const whereConditions: any[] = [];

    // Global posts go to everyone
    if (event.scope === PostScope.GLOBAL) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      return users.map(u => u.id);
    }

    // Department-specific posts
    if (event.scope === PostScope.DEPARTMENT && event.departmentId) {
      whereConditions.push({ departmentId: event.departmentId });
    }

    // Year-specific posts
    if (event.scope === PostScope.YEAR && event.targetYear) {
      whereConditions.push({ currentYear: event.targetYear });
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: whereConditions,
      },
      select: { id: true },
    });

    return users.map(u => u.id);
  }

  private async getDepartmentUsers(departmentId?: string): Promise<string[]> {
    if (!departmentId) return [];

    const users = await this.prisma.user.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      select: { id: true },
    });

    return users.map(u => u.id);
  }

  private async getPostSubscribers(postId: string): Promise<string[]> {
    // For now, return users who have interacted with the post
    // In the future, this could include explicit subscribers
    const interactions = await this.prisma.user.findMany({
      where: {
        // This would need a post interactions table
        // For now, return empty array
        id: 'none',
      },
      select: { id: true },
    });

    return interactions.map(u => u.id);
  }

  private getNotificationTypeForPost(event: PostCreatedEvent): NotificationType {
    if (event.priority === Priority.URGENT) {
      return NotificationType.POST_URGENT;
    }

    return NotificationType.POST_CREATED;
  }

  private async sendNotificationsToUsers(
    userIds: string[],
    type: NotificationType,
    data: Partial<PostNotificationPayload['data']>
  ) {
    try {
      // 🚀 NEW: Use bulk notification queue for better performance
      const title = this.getNotificationTitle(type, data);
      const body = this.getNotificationBody(type, data);
      
      await this.notificationQueueService.queueBulkNotification(
        userIds,
        title,
        body,
        type,
        50, // Process in batches of 50
        100  // Batch size for queue processing
      );
      
      this.logger.log(`✅ Queued bulk notification for ${userIds.length} users (type: ${type})`);
    } catch (error) {
      this.logger.error(`Failed to queue bulk notifications: ${error.message}`);
      // Fallback to direct notification (keep system working)
      await this.sendNotificationsDirectly(userIds, type, data);
    }
  }

  /**
   * Fallback method for direct notifications if queue fails
   */
  private async sendNotificationsDirectly(
    userIds: string[],
    type: NotificationType,
    data: Partial<PostNotificationPayload['data']>
  ) {
    // Send notifications in batches to avoid overwhelming the system
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await Promise.all(
        batch.map(userId => 
          this.notificationService.sendNotification({
            recipientId: userId,
            type,
            templateData: data,
            sourceId: data.postId || '',
            sourceType: 'post',
          })
        )
      );
    }
  }

  /**
   * Helper method to generate notification title
   */
  private getNotificationTitle(type: NotificationType, data: any): string {
    switch (type) {
      case NotificationType.POST_CREATED:
        return 'New Post Published';
      case NotificationType.POST_UPDATED:
        return 'Post Updated';
      case NotificationType.POST_PINNED:
        return 'Post Pinned';
      case NotificationType.POST_URGENT:
        return '🚨 Urgent Post';
      case NotificationType.ASSIGNMENT_DEADLINE:
        return '📅 Assignment Deadline';
      default:
        return 'New Notification';
    }
  }

  /**
   * Helper method to generate notification body
   */
  private getNotificationBody(type: NotificationType, data: any): string {
    const title = data.title || 'Unknown';
    const authorName = data.authorName || 'Someone';
    
    switch (type) {
      case NotificationType.POST_CREATED:
        return `${authorName} published: ${title}`;
      case NotificationType.POST_UPDATED:
        return `${authorName} updated: ${title}`;
      case NotificationType.POST_PINNED:
        return `Important post pinned: ${title}`;
      case NotificationType.POST_URGENT:
        return `Urgent: ${title}`;
      case NotificationType.ASSIGNMENT_DEADLINE:
        return `Assignment deadline approaching: ${title}`;
      default:
        return title;
    }
  }

  private getTimeRangeForPeriod(period: 'daily' | 'weekly') {
    const now = new Date();
    const start = new Date();

    if (period === 'daily') {
      start.setDate(now.getDate() - 1);
    } else {
      start.setDate(now.getDate() - 7);
    }

    return { start, end: now };
  }
}
