# WebSocket Testing Guide for MU-Compass API

## Overview
You can test the WebSocket functi## Testing File Attachments in Chat

### Complete File Sharing Workflow

#### Step 1: Upload Files First
Before sending messages with attachments, you need to upload files using the REST API:

```bash
# Upload a file using Postman
POST {{baseUrl}}/chat/upload
Content-Type: multipart/form-data
Authorization: Bearer {{accessToken}}

# Body: form-data
file: [select your file]
```

This returns:
```json
{
  "success": true,
  "file": {
    "id": "file-abc-123",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024000,
    "fileCategory": "document"
  }
}
```

#### Step 2: Use File ID in WebSocket Messages
Copy the `file.id` from the upload response and use it in WebSocket messages:

```json
{
  "event": "send_private_message",
  "data": {
    "recipientId": "user-456",
    "content": "Here's the document you requested",
    "attachments": [
      {
        "fileId": "file-abc-123",
        "originalName": "document.pdf",
        "mimeType": "application/pdf"
      }
    ]
  }
}
```

#### Step 3: Receive Real-time File Notifications
Recipients will receive the message with complete file metadata:

```json
{
  "event": "new_private_message",
  "data": {
    "message": {
      "id": "msg-789",
      "content": "Here's the document you requested",
      "attachments": [
        {
          "id": "file-abc-123",
          "originalName": "document.pdf",
          "mimeType": "application/pdf",
          "fileSize": 1024000,
          "fileCategory": "document",
          "serveUrl": "/files/file-abc-123/serve",
          "thumbnails": {
            "small": "path/to/thumbnail-small.jpg"
          }
        }
      ]
    }
  }
}
```

#### Step 4: Access Files
Recipients can access files using the provided URLs:
- **View**: `GET {{baseUrl}}/chat/files/file-abc-123/serve` (inline display)
- **Download**: `GET {{baseUrl}}/chat/files/file-abc-123/download` (force download)
- **Thumbnail**: `GET {{baseUrl}}/chat/files/file-abc-123/thumbnails/medium`

### File Validation Rules

The system automatically validates:
- ✅ **File Ownership**: Users can only attach files they uploaded
- ✅ **File Context**: Only files uploaded with `CHAT_MESSAGE` context
- ✅ **File Size**: 25MB limit for chat attachments
- ✅ **File Types**: All standard file types (images, documents, videos, audio)

### Error Scenarios

**File Not Found:**
```json
{
  "event": "message_error",
  "data": {
    "error": "File file-xyz-999 not found or access denied",
    "timestamp": "2025-07-26T10:30:00Z"
  }
}
```

**File Too Large:**
```json
{
  "event": "message_error",
  "data": {
    "error": "File size exceeds 25MB limit for chat messages",
    "timestamp": "2025-07-26T10:30:00Z"
  }
}
```

**Invalid File Context:**
```json
{
  "event": "message_error",
  "data": {
    "error": "File must be uploaded with CHAT_MESSAGE context",
    "timestamp": "2025-07-26T10:30:00Z"
  }
}
```Compass API**Send Group Message with File:**
```json
{
  "event": "send_group_message",
  "data": {
    "roomId": "room-id-here",
    "content": "Here's the assignment file!",
    "messageType": "TEXT",
    "attachments": [
      {
        "fileId": "assignment-file-id",
        "originalName": "assignment.docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    ]
  }
}
```

**Send Group Message (Multiple Files):**
```json
{
  "event": "send_group_message",
  "data": {
    "roomId": "room-id-here",
    "content": "Project resources",
    "messageType": "TEXT",
    "attachments": [
      {
        "fileId": "file-1-id",
        "originalName": "design.png",
        "mimeType": "image/png"
      },
      {
        "fileId": "file-2-id",
        "originalName": "requirements.pdf",
        "mimeType": "application/pdf"
      }
    ]
  }
}
```an's built-in WebSocket support. This guide covers how to test both private and group chat features without needing a Flutter app.

## Prerequisites
1. **Postman Desktop App** (WebSocket support requires desktop version)
2. **Running API Server** on `localhost:3000`
3. **Valid JWT Token** (obtained through login)

## Testing Methods

### Method 1: Postman WebSocket Requests (Recommended)

#### Step 1: Authentication
1. Open your MU-Compass Postman collection
2. Go to **🔐 Authentication** → **Login**
3. Run the login request with valid credentials:
   ```json
   {
     "email": "student@std.mans.edu.eg",
     "password": "password123"
   }
   ```
4. The `accessToken` will be automatically saved to collection variables

#### Step 2: Connect to WebSocket
1. Go to **🌐 WebSocket Testing** section
2. Choose either:
   - **Private Chat WebSocket** for 1-on-1 messaging
   - **Group Chat WebSocket** for group/course messaging

3. Click the WebSocket request
4. Click **Connect** - the JWT token will be automatically included

#### Step 3: Send Events
Once connected, you can send JSON events in the message input:

### Private Chat Events

**Join Private Room:**
```json
{
  "event": "joinRoom",
  "data": {
    "otherUserId": "user-id-here"
  }
}
```

**Send Private Message with File:**
```json
{
  "event": "send_private_message",
  "data": {
    "recipientId": "user-id-here",
    "content": "Check out this document!",
    "messageType": "TEXT",
    "attachments": [
      {
        "fileId": "file-id-from-upload",
        "originalName": "document.pdf",
        "mimeType": "application/pdf"
      }
    ]
  }
}
```

**Send Private Message (File Only):**
```json
{
  "event": "send_private_message",
  "data": {
    "recipientId": "user-id-here",
    "messageType": "FILE",
    "attachments": [
      {
        "fileId": "image-file-id",
        "originalName": "screenshot.png",
        "mimeType": "image/png"
      }
    ]
  }
}
```

**Mark Message as Read:**
```json
{
  "event": "markAsRead",
  "data": {
    "messageId": "message-id-here"
  }
}
```

**Send Typing Indicator:**
```json
{
  "event": "typing",
  "data": {
    "otherUserId": "user-id-here",
    "isTyping": true
  }
}
```

### Group Chat Events

**Join Group Room:**
```json
{
  "event": "joinRoom",
  "data": {
    "roomId": "room-id-here"
  }
}
```

**Send Group Message:**
```json
{
  "event": "sendMessage",
  "data": {
    "roomId": "room-id-here",
    "content": "Hello group from Postman!",
    "type": "TEXT",
    "attachments": ["file-id-if-any"]
  }
}
```

**Leave Group Room:**
```json
{
  "event": "leaveRoom",
  "data": {
    "roomId": "room-id-here"
  }
}
```

## Method 2: Browser WebSocket Testing

You can also test using browser developer tools:

```javascript
// Open browser console and run:
const socket = new WebSocket('ws://localhost:3000/private-chat?token=YOUR_JWT_TOKEN');

socket.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Join a room
  socket.send(JSON.stringify({
    event: 'joinRoom',
    data: { otherUserId: 'user-id-here' }
  }));
};

socket.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

// Send a message
socket.send(JSON.stringify({
  event: 'sendMessage',
  data: {
    otherUserId: 'user-id-here',
    content: 'Hello from browser!',
    type: 'TEXT'
  }
}));
```

## Method 3: Command Line Testing with wscat

Install and use wscat for command-line testing:

```bash
# Install wscat
npm install -g wscat

# Connect to private chat
wscat -c "ws://localhost:3000/private-chat?token=YOUR_JWT_TOKEN"

# Send events (paste JSON and press Enter)
{"event":"joinRoom","data":{"otherUserId":"user-id-here"}}
{"event":"sendMessage","data":{"otherUserId":"user-id-here","content":"Hello from wscat!","type":"TEXT"}}
```

## Testing File Attachments in Chat

### Step 1: Upload Files First
Use the **💬 Chat File Management** → **Upload Chat File** endpoint to upload files and get file IDs.

### Step 2: Include File IDs in Messages
```json
{
  "event": "sendMessage",
  "data": {
    "otherUserId": "user-id-here",
    "content": "Check out this file!",
    "type": "TEXT",
    "attachments": ["file-id-from-upload"]
  }
}
```

## Expected Server Responses

### Successful Connection
```json
{
  "event": "connected",
  "data": {
    "userId": "your-user-id",
    "message": "Connected to private chat"
  }
}
```

### Room Joined
```json
{
  "event": "roomJoined",
  "data": {
    "roomId": "room-id",
    "participants": ["user1", "user2"]
  }
}
```

### Message Received with Files
```json
{
  "event": "new_private_message",
  "data": {
    "message": {
      "id": "message-id",
      "content": "Check out this document!",
      "senderId": "sender-id",
      "senderName": "John Doe",
      "messageType": "TEXT",
      "sentAt": "2025-07-26T10:30:00Z",
      "attachments": [
        {
          "id": "file-id",
          "originalName": "document.pdf",
          "mimeType": "application/pdf",
          "fileSize": 1024000,
          "fileCategory": "document",
          "thumbnails": {
            "small": "path/to/small-thumb.jpg",
            "medium": "path/to/medium-thumb.jpg"
          },
          "serveUrl": "/files/file-id/serve"
        }
      ]
    },
    "timestamp": "2025-07-26T10:30:00Z"
  }
}
```

### Group Message with Files
```json
{
  "event": "group_message_received",
  "data": {
    "messageId": "message-id",
    "senderId": "sender-id",
    "senderName": "Jane Smith",
    "roomId": "room-id",
    "content": "Assignment files",
    "messageType": "TEXT",
    "attachments": [
      {
        "id": "file-1-id",
        "originalName": "homework.docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "fileSize": 2048000,
        "fileCategory": "document",
        "serveUrl": "/files/file-1-id/serve"
      },
      {
        "id": "file-2-id",
        "originalName": "diagram.png",
        "mimeType": "image/png",
        "fileSize": 512000,
        "fileCategory": "image",
        "thumbnails": {
          "small": "path/to/small-thumb.jpg",
          "medium": "path/to/medium-thumb.jpg",
          "large": "path/to/large-thumb.jpg"
        },
        "serveUrl": "/files/file-2-id/serve"
      }
    ],
    "timestamp": "2025-07-26T10:30:00Z"
  }
}
```

### Typing Indicator
```json
{
  "event": "userTyping",
  "data": {
    "userId": "user-id",
    "isTyping": true
  }
}
```

## Error Handling

### Authentication Errors
```json
{
  "event": "error",
  "data": {
    "message": "Unauthorized",
    "code": "AUTH_FAILED"
  }
}
```

### Invalid Room/User
```json
{
  "event": "error",
  "data": {
    "message": "Room not found",
    "code": "ROOM_NOT_FOUND"
  }
}
```

## Testing Scenarios

### Scenario 1: Private Conversation
1. Login with User A credentials
2. Connect to private chat WebSocket
3. Join room with User B's ID
4. Send messages back and forth
5. Test typing indicators
6. Test file attachments

### Scenario 2: Group Chat
1. Login with student credentials
2. Connect to group chat WebSocket
3. Join a course room (get room ID from course enrollment)
4. Send group messages
5. Test leaving and rejoining

### Scenario 3: Real-time Features
1. Open two browser windows/Postman instances
2. Login with different users
3. Connect both to the same room
4. Test real-time message delivery
5. Test typing indicators between users

## Troubleshooting

### Connection Issues
- Ensure JWT token is valid and not expired
- Check that the server is running on `localhost:3000`
- Verify WebSocket upgrade headers in network tab

### Authentication Issues
- Refresh JWT token using the refresh endpoint
- Ensure token is included in query parameter `?token=`

### Message Issues
- Verify JSON format is correct
- Check that room/user IDs exist in database
- Ensure user has permission to access the room

## Integration with Task 4

Once you've tested the current WebSocket functionality, you can use these same testing methods for:
- File attachment support in real-time messages
- Enhanced message validation
- File sharing notifications
- File access control testing

This testing approach will help validate all WebSocket functionality before integrating with your Flutter app!
