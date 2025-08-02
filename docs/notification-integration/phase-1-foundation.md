# Phase 1: Foundation & Module Integration ⚡

**Status:** 🔧 In Progress  
**Estimated Time:** 2-3 hours  
**Dependencies:** Notification module must be completed

## Overview

This phase establishes the foundation for chat-notification integration by:
1. Adding NotificationService dependencies to the Chat module
2. Injecting notification services into chat components
3. Setting up basic module structure for integration

## Implementation Steps

### 1.1 Update Chat Module Dependencies

**File:** `src/modules/chat/chat.module.ts`

Add the NotificationsModule to imports and export necessary services for cross-module communication.

**Changes:**
- Import NotificationsModule
- Add NotificationService to providers if needed
- Export services for other modules

### 1.2 Inject NotificationService into Chat Components

Update the following components to include NotificationService:

**Files to modify:**
- `src/modules/chat/gateways/private-chat.gateway.ts`
- `src/modules/chat/gateways/group-chat.gateway.ts`  
- `src/modules/chat/services/chat-automation.service.ts`
- `src/modules/chat/services/chat-event-emitter.service.ts`

**Injection Pattern:**
```typescript
constructor(
  // ... existing dependencies
  private notificationService: NotificationService,
) {}
```

## Code Changes

### 1.1 Chat Module Update

```typescript
// chat.module.ts
imports: [
  NotificationsModule, // 🆕 NEW
  FilesModule,
  JwtModule.registerAsync({...})
],
providers: [
  // ... existing providers
  // NotificationService will be available via NotificationsModule
],
exports: [
  ChatService, 
  ChatEventEmitterService,
  // Potentially export for other modules that need chat-notification integration
]
```

### 1.2 Gateway Injections

**Private Chat Gateway:**
```typescript
constructor(
  private chatService: ChatService,
  private notificationService: NotificationService, // 🆕 NEW
) {}
```

**Group Chat Gateway:**
```typescript
constructor(
  private readonly chatService: ChatService,
  private readonly notificationService: NotificationService, // 🆕 NEW
) {}
```

### 1.3 Service Injections

**Chat Automation Service:**
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly notificationService: NotificationService, // 🆕 NEW
) {}
```

**Chat Event Emitter Service:**
```typescript
constructor(
  private readonly eventEmitter: EventEmitter2,
  private readonly notificationService: NotificationService, // 🆕 NEW
) {}
```

## Testing

### Unit Tests
- Verify all injections work correctly
- Test module imports and exports
- Ensure no circular dependencies

### Integration Tests
- Test that NotificationService is available in chat components
- Verify module loads without errors
- Check dependency injection tree

## Verification Steps

1. ✅ All TypeScript compilation errors resolved
2. ✅ Module loads without dependency injection errors
3. ✅ Services are properly injected and accessible
4. ✅ No circular dependency warnings
5. ✅ Existing chat functionality remains unchanged

## Notes

- This phase only sets up the foundation - no notification sending logic is implemented yet
- All existing chat functionality should continue to work unchanged
- The NotificationService will be available but not yet used

## Next Phase

After completing Phase 1, proceed to [Phase 2: Event-Driven Topic Subscription Management](./phase-2-events.md) to set up the event system for automatic topic subscriptions.

---

**Implementation Date:** August 2, 2025  
**Reviewer:** TBD  
**Status:** 🔧 In Progress
