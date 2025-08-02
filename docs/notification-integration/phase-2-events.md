# Phase 2: Event-Driven Topic Subscription Management 🎯

**Status:** 🔧 **IN PROGRESS**  
**Estimated Time:** 4-5 hours  
**Dependencies:** ✅ Phase 1 Completed

## Overview

This phase implements automatic topic subscription management using the existing event-driven architecture. When users join/leave groups or enroll in classes, they will automatically be subscribed/unsubscribed from relevant notification topics.

## Implementation Steps

### 2.1 Extend ChatEventEmitterService ✅
Add new notification-specific events for topic management

### 2.2 Create NotificationAutomationService 🔧
New service to handle notification events and manage topic subscriptions

### 2.3 Update ChatAutomationService 🔧
Emit notification events when rooms are created or users are added/removed

## Key Events to Add

- `user.joined.group` - When user joins a chat room
- `user.left.group` - When user leaves a chat room
- `user.enrolled.class` - When user enrolls in a class
- `user.removed.class` - When user is removed from class
- `room.created` - When new chat room is created
- `room.deleted` - When chat room is deleted

## Topic Naming Convention

- Group chats: `group_{roomId}`
- Class rooms: `class_{classId}`
- Department notifications: `dept_{deptId}`
- Course announcements: `course_{courseId}`

## Implementation Details

### New Event DTOs
```typescript
export interface UserJoinedGroupEventDto {
  roomId: string;
  userId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
  timestamp: Date;
}

export interface UserLeftGroupEventDto {
  roomId: string;
  userId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
  timestamp: Date;
}

export interface RoomCreatedEventDto {
  roomId: string;
  roomType: 'GROUP' | 'CLASS' | 'SECTION';
  memberIds: string[];
  createdBy: string;
  timestamp: Date;
}
```

### NotificationAutomationService
```typescript
@Injectable()
export class NotificationAutomationService {
  @OnEvent('user.joined.group')
  async handleUserJoinedGroup(payload: UserJoinedGroupEventDto) {
    const topicName = this.generateTopicName(payload.roomId, payload.roomType);
    await this.notificationService.subscribeToTopic(payload.userId, topicName);
  }

  @OnEvent('user.left.group')
  async handleUserLeftGroup(payload: UserLeftGroupEventDto) {
    const topicName = this.generateTopicName(payload.roomId, payload.roomType);
    await this.notificationService.unsubscribeFromTopic(payload.userId, topicName);
  }

  @OnEvent('room.created')
  async handleRoomCreated(payload: RoomCreatedEventDto) {
    const topicName = this.generateTopicName(payload.roomId, payload.roomType);
    
    // Subscribe all initial members to the topic
    for (const userId of payload.memberIds) {
      await this.notificationService.subscribeToTopic(userId, topicName);
    }
  }
}
```

---

**Implementation Date:** August 2, 2025  
**Status:** 🔧 In Progress
