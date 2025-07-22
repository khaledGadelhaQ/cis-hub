# Chat System Implementation - Updated Documentation

## Overview
This document outlines the comprehensive chat system implementation with the latest improvements and architectural changes.

## Architecture Changes (July 2025)

### Key Improvements Made:
1. **Unified Message DTOs** - Consistent structure across private and group messages
2. **Single Session Management** - One active session per user for mobile app optimization
3. **Enhanced Group Messaging** - Added reply support with message previews
4. **Improved Security** - Created dedicated WsJwtGroupGuard for group access validation
5. **Simplified UI** - Removed group typing indicators for better UX in large groups
6. **Streamlined Authentication** - Simplified private chat typing indicators

---

## 🏗️ System Architecture

### Core Components:
- **PrivateChatGateway** (`/chat/private`) - 1:1 messaging
- **GroupChatGateway** (`/chat/groups`) - Course/section group messaging  
- **ChatService** - Business logic and data management
- **WsJwtGuard** - Basic WebSocket JWT authentication
- **WsJwtGroupGuard** - Enhanced guard with group access validation

### Database Schema:
- 9 chat-related tables integrated with existing academic schema
- Support for file attachments, message reactions, read receipts
- 5-month message retention policy with auto-cleanup

---

## 📱 Mobile App Integration

### WebSocket Authentication:
```typescript
// Mobile app should send JWT token in handshake
const socket = io('ws://your-api.com/chat/private', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Session Management:
- **Single session per user** - New login replaces previous session
- Automatic disconnection of old sessions with notification
- Simplified online/offline status tracking

---

## 🔐 Security & Authorization

### Authentication Guards:

#### WsJwtGuard (Basic)
- Validates JWT token from handshake
- Attaches user data to socket: `{ id, email, role }`
- Used for private chat and basic group operations

#### WsJwtGroupGuard (Enhanced)  
- Extends WsJwtGuard functionality
- Validates group access permissions automatically
- Extracts roomId from message data
- Used for all group message operations

### Usage Examples:
```typescript
// Private chat - basic auth
@UseGuards(WsJwtGuard)
@SubscribeMessage('send_private_message')

// Group chat - auth + access validation
@UseGuards(WsJwtGroupGuard) 
@SubscribeMessage('send_group_message')
```

---

## 💬 Message Types & DTOs

### Unified Message Structure:

#### SendPrivateMessageDto:
```typescript
{
  content?: string;           // Optional for file-only messages
  recipientId: string;        // Required - recipient user ID
  replyToId?: string;         // Optional - message being replied to
  messageType?: MessageContentType; // TEXT | FILE | MIXED
  attachments?: FileAttachmentDto[]; // File metadata
}
```

#### SendGroupMessageDto:
```typescript
{
  content?: string;           // Optional for file-only messages  
  roomId: string;            // Required - group/room ID
  replyToId?: string;        // Optional - message being replied to
  messageType?: MessageContentType; // TEXT | FILE | MIXED
  attachments?: FileAttachmentDto[]; // File metadata
}
```

### File Support:
```typescript
interface FileAttachmentDto {
  fileId: string;
  originalName: string;
  mimeType: string;
}

enum MessageContentType {
  TEXT = 'TEXT',
  FILE = 'FILE', 
  MIXED = 'MIXED'  // Text with attachments
}
```

---

## 🚀 Real-time Events

### Private Chat Events:

#### Client → Server:
- `send_private_message` - Send private message
- `get_private_messages` - Get chat history (paginated)
- `mark_messages_read` - Mark messages as read
- `typing_private` - Typing indicator (simplified)
- `get_online_status` - Check if users are online

#### Server → Client:
- `connected` - Connection confirmation
- `message_sent` - Message delivery confirmation
- `new_private_message` - New incoming message
- `private_messages` - Chat history response
- `messages_marked_read` - Read receipt confirmation
- `typing_indicator_private` - Typing status
- `online_status` - User online status
- `session_replaced` - Session replaced by new login

### Group Chat Events:

#### Client → Server:
- `join_group` - Join group room
- `leave_group` - Leave group room  
- `send_group_message` - Send group message (with reply support)
- `get_group_messages` - Get group message history
- `mark_group_messages_read` - Mark messages as read
- `get_group_members` - Get room members
- `get_user_groups` - Get user's groups

#### Server → Client:
- `joined_group` - Group join confirmation
- `left_group` - Group leave confirmation
- `group_message_received` - New group message (with reply preview)
- `group_messages` - Message history response
- `messages_marked_read` - Read receipt
- `group_members` - Room members list
- `user_groups` - User's groups list
- `user_joined_group` / `user_left_group` - Member activity

---

## 🔄 Message Replies

### Group Message Replies:
- **Reply Preview**: First 50 characters of original message
- **Reply Structure**:
```typescript
{
  replyPreview: {
    id: string;
    content: string;        // Truncated to 50 chars + "..."
    senderName: string;
  } | null
}
```

### Implementation:
```typescript
// Sending a reply
{
  content: "Thanks for the information!",
  roomId: "course-123",
  replyToId: "original-message-id"
}

// Received message with reply
{
  messageId: "new-msg-id",
  content: "Thanks for the information!",
  replyPreview: {
    id: "original-message-id", 
    content: "Here's the assignment deadline: Dec 15th...",
    senderName: "Prof. Smith"
  }
}
```

---

## 📊 Socket Management

### Private Chat:
```typescript
// Single session tracking
private userSockets = new Map<string, string>(); // userId → socketId

// Connection handling
handleConnection(client: Socket) {
  // Disconnect existing session if any
  // Store new session
  // Join personal room: user:${userId}
}
```

### Group Chat:  
```typescript
// Group membership tracking
private connectedUsers = new Map<string, string>(); // "userId-roomId" → socketId

// Room joining
handleJoinGroup() {
  // Validate group access (via WsJwtGroupGuard)
  // Join socket room
  // Track user-room association
}
```

---

## 🔧 Development Notes

### Removed Features:
- **Group typing indicators** - Removed for better UX in large groups
- **Multi-socket support** - Simplified to single session per user
- **Complex user data in typing** - Simplified to just isTyping boolean

### Enhanced Features:
- **Automatic group access validation** via WsJwtGroupGuard
- **Message reply system** with preview support
- **Consistent DTO structure** across message types
- **Session replacement** notification for mobile apps

### File Integration:
- Ready for 40MB file limit integration
- File attachment metadata structure defined
- Support for file-only messages (no text content)

---

## 🧪 Testing Considerations

### Authentication Testing:
- Test JWT token in handshake auth header
- Test invalid/expired tokens
- Test session replacement scenarios

### Group Access Testing:
- Test unauthorized room access attempts
- Test group membership validation
- Test professor/TA access to sections

### Message Testing:
- Test reply functionality with preview generation
- Test file attachment handling
- Test pagination and message history

### Real-time Testing:
- Test concurrent user connections
- Test message delivery in groups
- Test online status accuracy

---

## 🚀 Next Phase Implementation

Ready for Phase 3 features:
- File upload integration (40MB limit)
- Push notification system
- Message retention automation
- Advanced moderation tools
- Analytics and reporting

The foundation is solid and optimized for mobile app usage with enhanced security and user experience.
