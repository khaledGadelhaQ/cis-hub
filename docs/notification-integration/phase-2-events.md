# Phase 2: Event-Driven Topic Subscription Management 🎯

**Status:** ⏳ Pending Phase 1 Completion  
**Estimated Time:** 4-5 hours  
**Dependencies:** Phase 1 must be completed

## Overview

This phase implements automatic topic subscription management using the existing event-driven architecture. When users join/leave groups or enroll in classes, they will automatically be subscribed/unsubscribed from relevant notification topics.

## Implementation Steps

### 2.1 Extend ChatEventEmitterService
Add new notification-specific events for topic management

### 2.2 Create NotificationAutomationService  
New service to handle notification events and manage topic subscriptions

### 2.3 Update ChatAutomationService
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

---

**Implementation Date:** TBD  
**Status:** ⏳ Pending
