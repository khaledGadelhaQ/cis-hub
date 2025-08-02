import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../../notifications/services/notification.service';
import {
  UserJoinedGroupEventDto,
  UserLeftGroupEventDto,
  RoomCreatedEventDto,
  RoomDeletedEventDto,
  UserEnrolledClassEventDto,
  UserRemovedClassEventDto,
} from '../dto/notification-events.dto';

/**
 * Service responsible for handling notification-related events
 * and automatically managing topic subscriptions for chat rooms
 */
@Injectable()
export class NotificationAutomationService {
  private readonly logger = new Logger(NotificationAutomationService.name);

  constructor(private readonly notificationService: NotificationService) {}

  // ================================
  // TOPIC NAMING UTILITIES
  // ================================

  /**
   * Generate consistent topic names based on room type and ID
   */
  private generateTopicName(roomId: string, roomType: 'GROUP' | 'CLASS' | 'SECTION'): string {
    switch (roomType) {
      case 'CLASS':
        return `class_${roomId}`;
      case 'SECTION':
        return `section_${roomId}`;
      case 'GROUP':
      default:
        return `group_${roomId}`;
    }
  }

  // ================================
  // USER JOIN/LEAVE EVENTS
  // ================================

  /**
   * Handle user joining a chat room - subscribe to topic
   */
  @OnEvent('user.joined.group')
  async handleUserJoinedGroup(payload: UserJoinedGroupEventDto): Promise<void> {
    try {
      const topicName = this.generateTopicName(payload.roomId, payload.roomType);
      
      await this.notificationService.subscribeToTopic(payload.userId, topicName);
      
      this.logger.log(
        `User ${payload.userId} subscribed to topic ${topicName} (room: ${payload.roomId})`
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe user ${payload.userId} to room ${payload.roomId}:`,
        error.message
      );
    }
  }

  /**
   * Handle user leaving a chat room - unsubscribe from topic
   */
  @OnEvent('user.left.group')
  async handleUserLeftGroup(payload: UserLeftGroupEventDto): Promise<void> {
    try {
      const topicName = this.generateTopicName(payload.roomId, payload.roomType);
      
      await this.notificationService.unsubscribeFromTopic(payload.userId, topicName);
      
      this.logger.log(
        `User ${payload.userId} unsubscribed from topic ${topicName} (room: ${payload.roomId})`
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${payload.userId} from room ${payload.roomId}:`,
        error.message
      );
    }
  }

  // ================================
  // ROOM LIFECYCLE EVENTS
  // ================================

  /**
   * Handle room creation - subscribe all initial members to topic
   */
  @OnEvent('room.created')
  async handleRoomCreated(payload: RoomCreatedEventDto): Promise<void> {
    try {
      const topicName = this.generateTopicName(payload.roomId, payload.roomType);
      
      this.logger.log(
        `Subscribing ${payload.memberIds.length} members to new room topic ${topicName}`
      );

      // Subscribe all initial members to the topic
      const subscriptionPromises = payload.memberIds.map(userId =>
        this.notificationService.subscribeToTopic(userId, topicName)
      );

      await Promise.allSettled(subscriptionPromises);

      this.logger.log(
        `Room ${payload.roomId} created with topic ${topicName}, subscribed ${payload.memberIds.length} members`
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle room creation for ${payload.roomId}:`,
        error.message
      );
    }
  }

  /**
   * Handle room deletion - unsubscribe all members from topic
   */
  @OnEvent('room.deleted')
  async handleRoomDeleted(payload: RoomDeletedEventDto): Promise<void> {
    try {
      const topicName = this.generateTopicName(payload.roomId, payload.roomType);
      
      this.logger.log(
        `Unsubscribing ${payload.memberIds.length} members from deleted room topic ${topicName}`
      );

      // Unsubscribe all members from the topic
      const unsubscriptionPromises = payload.memberIds.map(userId =>
        this.notificationService.unsubscribeFromTopic(userId, topicName)
      );

      await Promise.allSettled(unsubscriptionPromises);

      this.logger.log(
        `Room ${payload.roomId} deleted, unsubscribed ${payload.memberIds.length} members from topic ${topicName}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle room deletion for ${payload.roomId}:`,
        error.message
      );
    }
  }

  // ================================
  // CLASS ENROLLMENT EVENTS
  // ================================

  /**
   * Handle user enrollment in class - subscribe to class topic
   */
  @OnEvent('user.enrolled.class')
  async handleUserEnrolledClass(payload: UserEnrolledClassEventDto): Promise<void> {
    try {
      const topicName = `class_${payload.classId}`;
      
      await this.notificationService.subscribeToTopic(payload.userId, topicName);
      
      this.logger.log(
        `User ${payload.userId} enrolled in class ${payload.courseCode}, subscribed to topic ${topicName}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe user ${payload.userId} to class ${payload.classId}:`,
        error.message
      );
    }
  }

  /**
   * Handle user unenrollment from class - unsubscribe from class topic
   */
  @OnEvent('user.unenrolled.class')
  async handleUserUnenrolledClass(payload: UserRemovedClassEventDto): Promise<void> {
    try {
      const topicName = `class_${payload.classId}`;
      
      await this.notificationService.unsubscribeFromTopic(payload.userId, topicName);
      
      this.logger.log(
        `User ${payload.userId} unenrolled from class ${payload.courseCode}, unsubscribed from topic ${topicName}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${payload.userId} from class ${payload.classId}:`,
        error.message
      );
    }
  }

  /**
   * Handle user removal from class - unsubscribe from class topic
   */
  @OnEvent('user.removed.class')
  async handleUserRemovedClass(payload: UserRemovedClassEventDto): Promise<void> {
    try {
      const topicName = `class_${payload.classId}`;
      
      await this.notificationService.unsubscribeFromTopic(payload.userId, topicName);
      
      this.logger.log(
        `User ${payload.userId} removed from class ${payload.courseCode}, unsubscribed from topic ${topicName}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${payload.userId} from class ${payload.classId}:`,
        error.message
      );
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Bulk subscribe users to a topic (useful for existing rooms)
   */
  async bulkSubscribeToTopic(userIds: string[], topicName: string): Promise<void> {
    try {
      const subscriptionPromises = userIds.map(userId =>
        this.notificationService.subscribeToTopic(userId, topicName)
      );

      const results = await Promise.allSettled(subscriptionPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.logger.log(
        `Bulk subscription to ${topicName}: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      this.logger.error(`Failed bulk subscription to ${topicName}:`, error.message);
    }
  }

  /**
   * Bulk unsubscribe users from a topic
   */
  async bulkUnsubscribeFromTopic(userIds: string[], topicName: string): Promise<void> {
    try {
      const unsubscriptionPromises = userIds.map(userId =>
        this.notificationService.unsubscribeFromTopic(userId, topicName)
      );

      const results = await Promise.allSettled(unsubscriptionPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.logger.log(
        `Bulk unsubscription from ${topicName}: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      this.logger.error(`Failed bulk unsubscription from ${topicName}:`, error.message);
    }
  }
}
