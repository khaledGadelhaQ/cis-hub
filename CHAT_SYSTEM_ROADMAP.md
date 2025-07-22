# 🎓 College Chat System - Complete Roadmap & Architecture

## 📋 System Overview

### Chat Types Required:
1. **Private Chats** - 1:1 messaging between any users
2. **Course Class Groups** - Professor + All enrolled students
3. **TA Section Groups** - TA + Students from their specific sections (across courses)

### Architecture Philosophy:
- **Microservice Approach** within the chat module
- **Modular Gateways** for different chat types
- **Shared Services** for common functionality
- **Event-Driven Architecture** for real-time updates

---

## 🏗️ Architecture Design

```
📁 src/modules/chat/
├── 📁 gateways/
│   ├── private-chat.gateway.ts         # 1:1 messaging
│   ├── group-chat.gateway.ts           # Class & Section groups
│   └── notification.gateway.ts         # Real-time notifications
├── 📁 services/
│   ├── chat.service.ts                 # Core chat logic
│   ├── message.service.ts              # Message CRUD operations
│   ├── room.service.ts                 # Room management
│   ├── typing.service.ts               # Typing indicators
│   ├── file.service.ts                 # File handling
│   └── notification.service.ts         # Push notifications
├── 📁 controllers/
│   ├── chat.controller.ts              # REST API endpoints
│   └── admin.controller.ts             # Admin chat settings
├── 📁 dto/
│   ├── message.dto.ts
│   ├── room.dto.ts
│   └── typing.dto.ts
├── 📁 guards/
│   ├── ws-jwt.guard.ts                 # WebSocket JWT authentication
│   └── room-access.guard.ts            # Room permission validation
├── 📁 interceptors/
│   └── message.interceptor.ts          # Message validation & formatting
└── chat.module.ts
```

---

## 🗄️ Database Schema Design

### New Tables to Add:

```prisma
// ================================
// CHAT SYSTEM TABLES
// ================================

// Chat Rooms (Groups)
model ChatRoom {
  id          String      @id @default(cuid())
  name        String      // "CS301 Class", "TA Ahmed Sections", etc.
  description String?
  type        RoomType    // CLASS, SECTION, PRIVATE
  isActive    Boolean     @default(true) @map("is_active")
  
  // Class room specific
  courseClassId String?   @map("course_class_id")
  
  // Section room specific (for TAs with multiple sections)
  taId        String?     @map("ta_id")
  courseId    String?     @map("course_id")
  
  // Admin settings
  isMessagingEnabled Boolean @default(true) @map("is_messaging_enabled")
  slowModeSeconds    Int?    @map("slow_mode_seconds")
  
  // Timestamps
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  
  // Relations
  courseClass CourseClass? @relation(fields: [courseClassId], references: [id])
  ta          User?        @relation("TARooms", fields: [taId], references: [id])
  course      Course?      @relation(fields: [courseId], references: [id])
  
  members     RoomMember[]
  messages    ChatMessage[]
  pinnedMessages PinnedMessage[]
  
  @@map("chat_rooms")
}

enum RoomType {
  CLASS     // Course class group
  SECTION   // TA sections group
  PRIVATE   // 1:1 chat
}

// Room Members
model RoomMember {
  id         String           @id @default(cuid())
  roomId     String           @map("room_id")
  userId     String           @map("user_id")
  role       RoomMemberRole   @default(MEMBER)
  joinedAt   DateTime         @default(now()) @map("joined_at")
  lastSeenAt DateTime?        @map("last_seen_at")
  isMuted    Boolean          @default(false) @map("is_muted")
  
  // Relations
  room ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, userId])
  @@map("room_members")
}

enum RoomMemberRole {
  ADMIN   // Professors, TAs in their rooms
  MEMBER  // Students
}

// Chat Messages
model ChatMessage {
  id        String      @id @default(cuid())
  roomId    String      @map("room_id")
  senderId  String      @map("sender_id")
  content   String?     // Text content (null for file-only messages, max 40MB files)
  messageType MessageType @default(TEXT) @map("message_type")
  
  // Reply functionality
  replyToId String?     @map("reply_to_id")
  
  // Message status
  isEdited  Boolean     @default(false) @map("is_edited")
  isDeleted Boolean     @default(false) @map("is_deleted")
  
  // Timestamps (auto-delete after 5 months)
  sentAt    DateTime    @default(now()) @map("sent_at")
  editedAt  DateTime?   @map("edited_at")
  
  // Relations
  room      ChatRoom     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sender    User         @relation(fields: [senderId], references: [id])
  replyTo   ChatMessage? @relation("MessageReplies", fields: [replyToId], references: [id])
  replies   ChatMessage[] @relation("MessageReplies")
  
  attachments MessageFile[]
  readReceipts MessageReadReceipt[]
  
  @@map("chat_messages")
}

enum MessageType {
  TEXT
  FILE
  IMAGE
  SYSTEM  // "User joined", "Settings changed", etc.
}

// Message Files (extends existing File table)
model MessageFile {
  id        String      @id @default(cuid())
  messageId String      @map("message_id")
  fileId    String      @map("file_id")
  
  // Relations
  message ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  file    File        @relation(fields: [fileId], references: [id])
  
  @@unique([messageId, fileId])
  @@map("message_files")
}

// Read Receipts
model MessageReadReceipt {
  id        String      @id @default(cuid())
  messageId String      @map("message_id")
  userId    String      @map("user_id")
  readAt    DateTime    @default(now()) @map("read_at")
  
  // Relations
  message ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId])
  @@map("message_read_receipts")
}

// Pinned Messages
model PinnedMessage {
  id        String      @id @default(cuid())
  roomId    String      @map("room_id")
  messageId String      @map("message_id")
  pinnedBy  String      @map("pinned_by")
  pinnedAt  DateTime    @default(now()) @map("pinned_at")
  
  // Relations
  room     ChatRoom    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  message  ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user     User        @relation(fields: [pinnedBy], references: [id])
  
  @@unique([roomId, messageId])
  @@map("pinned_messages")
}

// Typing Indicators (In-memory, but can be persisted for reliability)
model TypingIndicator {
  id       String   @id @default(cuid())
  roomId   String   @map("room_id")
  userId   String   @map("user_id")
  startedAt DateTime @default(now()) @map("started_at")
  
  // Relations
  room ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, userId])
  @@map("typing_indicators")
}

// Private Chat Settings
model PrivateChatSettings {
  id              String  @id @default(cuid())
  user1Id         String  @map("user1_id")
  user2Id         String  @map("user2_id")
  isBlockedByUser1 Boolean @default(false) @map("is_blocked_by_user1")
  isBlockedByUser2 Boolean @default(false) @map("is_blocked_by_user2")
  createdAt       DateTime @default(now()) @map("created_at")
  
  // Relations
  user1 User @relation("PrivateChatsAsUser1", fields: [user1Id], references: [id])
  user2 User @relation("PrivateChatsAsUser2", fields: [user2Id], references: [id])
  
  @@unique([user1Id, user2Id])
  @@map("private_chat_settings")
}
```

### Updated User Model Relations:
```prisma
model User {
  // ... existing fields ...
  
  // Chat relations
  roomMemberships    RoomMember[]
  sentMessages       ChatMessage[]
  messageReadReceipts MessageReadReceipt[]
  pinnedMessages     PinnedMessage[]
  typingIndicators   TypingIndicator[]
  taRooms           ChatRoom[]           @relation("TARooms")
  privateChatsAsUser1 PrivateChatSettings[] @relation("PrivateChatsAsUser1")
  privateChatsAsUser2 PrivateChatSettings[] @relation("PrivateChatsAsUser2")
}

model File {
  // ... existing fields ...
  
  // Chat relations
  messageFiles MessageFile[]
}

model Course {
  // ... existing fields ...
  
  // Chat relations
  chatRooms ChatRoom[]
}

model CourseClass {
  // ... existing fields ...
  
  // Chat relations
  chatRoom ChatRoom?
}
```

---

## 📅 Implementation Roadmap

### 🔥 Phase 1: Foundation (Week 1-2)
**Goal: Basic infrastructure and authentication**

#### Tasks:
1. **Database Schema Setup**
   - Create new Prisma models
   - Run migrations
   - Set up relationships

2. **JWT WebSocket Authentication**
   - Create `WsJwtGuard`
   - Implement token validation for WebSocket connections
   - Handle authentication errors gracefully

3. **Basic Module Structure**
   - Set up chat module with proper service organization
   - Create base DTOs and interfaces
   - Implement basic error handling

#### Deliverable: 
- ✅ Database ready
- ✅ Authenticated WebSocket connection
- ✅ Module structure in place

---

### ⚡ Phase 2: Core Messaging (Week 3-4)
**Goal: Basic messaging functionality**

#### Tasks:
1. **Message Service & Repository**
   - CRUD operations for messages
   - Message validation and sanitization
   - Basic message retrieval with pagination

2. **Private Chat Gateway**
   - 1:1 messaging implementation
   - Real-time message delivery
   - Online/offline status

3. **Room Management Service**
   - Create/join/leave rooms
   - Room permission validation
   - Member management

#### Deliverable:
- ✅ Users can send/receive private messages
- ✅ Message history with pagination
- ✅ Basic room functionality

---

### 🏫 Phase 3: Academic Integration (Week 5-6)
**Goal: Course-based chat rooms**

#### Tasks:
1. **Auto-Room Creation**
   - Service to create rooms when courses/classes are created
   - Bulk member addition from enrollments
   - Role assignment (Professor as admin, students as members)

2. **Group Chat Gateway**
   - Class group messaging
   - TA section groups
   - Broadcast messages

3. **Academic Data Integration**
   - Sync with course enrollments
   - Handle enrollment changes
   - Manage TA section assignments

#### Deliverable:
- ✅ Automatic class group creation
- ✅ TA section groups working
- ✅ Academic role-based permissions

---

### 📎 Phase 4: Rich Features (Week 7-8)
**Goal: File sharing and advanced messaging**

#### Tasks:
1. **File Sharing Integration**
   - Extend existing file service for chat
   - Image preview generation
   - File size and type restrictions

2. **Typing Indicators**
   - Real-time typing status
   - Cleanup inactive indicators
   - Multiple users typing display

3. **Message Enhancements**
   - Reply to messages
   - Message editing/deletion
   - Read receipts

#### Deliverable:
- ✅ File and image sharing
- ✅ Typing indicators
- ✅ Rich message features

---

### 🔔 Phase 5: Notifications (Week 9-10)
**Goal: Push notifications integration**

#### Tasks:
1. **Firebase Integration**
   - Set up Firebase Admin SDK
   - Device token management
   - Notification templates

2. **Smart Notifications**
   - Only notify when user is offline/away
   - Batch notifications for multiple messages
   - Notification preferences

3. **Notification Service**
   - Queue system for reliable delivery
   - Retry mechanism
   - Analytics and logging

#### Deliverable:
- ✅ Push notifications working
- ✅ Smart notification logic
- ✅ User notification preferences

---

### ⚙️ Phase 6: Admin Features (Week 11-12)
**Goal: Chat administration and moderation**

#### Tasks:
1. **Admin Controls**
   - Enable/disable messaging in rooms
   - Slow mode implementation
   - Member muting/removal

2. **Message Moderation**
   - Pin/unpin messages
   - Message deletion by admins
   - Announcement messages

3. **Analytics Dashboard**
   - Message statistics
   - Active users tracking
   - Room activity metrics

#### Deliverable:
- ✅ Full admin control panel
- ✅ Moderation tools
- ✅ Usage analytics

---

### 🚀 Phase 7: Optimization & Polish (Week 13-14)
**Goal: Performance and user experience**

#### Tasks:
1. **Performance Optimization**
   - Message caching strategy
   - Database query optimization
   - Connection pooling

2. **Error Handling & Resilience**
   - Graceful disconnection handling
   - Message retry mechanism
   - Offline message queuing

3. **Security Hardening**
   - Rate limiting
   - Input validation
   - Privacy controls

#### Deliverable:
- ✅ Production-ready performance
- ✅ Robust error handling
- ✅ Security measures in place

---

## 🎯 NestJS Architecture Decisions

### Multiple Gateways Approach:
**✅ YES - Separate gateways for different concerns:**

1. **PrivateChatGateway** - Handles 1:1 messaging
2. **GroupChatGateway** - Handles class/section groups
3. **NotificationGateway** - Handles real-time notifications

### Why Multiple Gateways?
- **Separation of Concerns** - Each gateway handles specific chat types
- **Better Scalability** - Can scale different parts independently
- **Cleaner Code** - Smaller, focused gateway classes
- **Easier Testing** - Test different features in isolation
- **Flexible Deployment** - Can deploy gateways on different namespaces

### Shared Services Pattern:
- **ChatService** - Core business logic
- **MessageService** - Message operations
- **RoomService** - Room management
- **FileService** - File handling
- **NotificationService** - Push notifications

### Flutter Integration Considerations:
- **Event-based architecture** for real-time updates
- **JSON-based message format** for easy parsing
- **Consistent error format** across all gateways
- **Connection state management** helpers
- **Offline message queuing** support

---

## 🔐 Security & Performance Considerations

### Authentication:
- JWT token validation on WebSocket handshake
- Room-level permission checks
- Rate limiting per user

### Privacy:
- Private chat encryption consideration
- Message deletion (soft delete)
- Block/unblock functionality

### Performance:
- Message pagination (50 messages per page)
- Image compression and thumbnails
- Connection pooling
- Message caching (Redis recommended)

### Flutter-Specific:
- Consistent API response format
- Error code standardization
- Offline support planning
- Background sync strategy

---

## ✅ Requirements Specifications

1. **File Size Limits**: Maximum 40MB for chat attachments

2. **Message Retention**: Auto-delete messages older than 5 months

3. **Notification Scope**: Include message preview for better UX

4. **Class Size Limits**: 
   - Classes: Up to 400 students
   - Sections: Up to 200 students

5. **TA Flexibility**: TAs can teach multiple sections but keep them in one group (same content)

6. **Admin Hierarchy**: Professors only admin their class groups (no cross-admin access)

7. **Real-time Requirements**: Standard latency (< 1 second for small user base)

8. **Backend Focus**: System design and backend implementation (Flutter handled separately)

---

This roadmap provides a structured approach to building your college chat system while maintaining code quality and scalability. Each phase builds upon the previous one, ensuring a solid foundation before adding complex features.

Would you like me to start with Phase 1 implementation, or do you have any questions about this roadmap?
