# Chat File Management Endpoints

## Overview
New chat-specific file management endpoints added to support file attachments in chat messages. These endpoints are organized into three main categories:

## 📁 File Upload & Management (`/api/chat/`)

### 1. Upload Single Chat File
- **Endpoint**: `POST /api/chat/upload`
- **Purpose**: Upload a single file for use in chat messages
- **Body**: `multipart/form-data` with `file` field
- **Response**: File metadata with unique ID
- **Auto-saves**: `chatFileId` variable in Postman

### 2. Upload Multiple Chat Files
- **Endpoint**: `POST /api/chat/upload/batch`
- **Purpose**: Upload multiple files at once
- **Body**: `multipart/form-data` with multiple `files` fields
- **Response**: Array of file metadata

### 3. Get Chat File Details
- **Endpoint**: `GET /api/chat/files/{fileId}`
- **Purpose**: Get file metadata and details
- **Response**: Complete file information

### 4. Get Chat File Statistics
- **Endpoint**: `GET /api/chat/files/stats`
- **Purpose**: Get usage statistics for chat files
- **Response**: Storage usage, file counts, etc.

## 🌐 File Serving & Content Delivery (`/api/chat/files/`)

### 1. Serve File (Inline Display)
- **Endpoint**: `GET /api/chat/files/{fileId}/serve`
- **Purpose**: Stream file for direct display in Flutter app
- **Headers**: `Content-Disposition: inline`
- **Use Case**: Display images, videos, PDFs in chat

### 2. Download File (Force Download)
- **Endpoint**: `GET /api/chat/files/{fileId}/download`
- **Purpose**: Force download to user's device
- **Headers**: `Content-Disposition: attachment`
- **Use Case**: User wants to save file locally

### 3. Get Thumbnails
- **Endpoints**: 
  - `GET /api/chat/files/{fileId}/thumbnails/small`
  - `GET /api/chat/files/{fileId}/thumbnails/medium`
  - `GET /api/chat/files/{fileId}/thumbnails/large`
- **Purpose**: Get resized images for fast loading
- **Format**: JPEG thumbnails
- **Use Case**: Chat preview, gallery view

## 🔍 File Discovery & Search (`/api/chat/files/`)

### 1. Get Files from Message
- **Endpoint**: `GET /api/chat/files/message/{messageId}`
- **Purpose**: Get all files attached to a specific message
- **Response**: Array of files for that message

### 2. Get Accessible Chat Files
- **Endpoint**: `GET /api/chat/files/accessible`
- **Query Parameters**:
  - `limit`: Number of files (default: 20, max: 100)
  - `offset`: Pagination offset
  - `fileType`: Filter by type (`image`, `video`, `document`, `audio`)
- **Purpose**: Browse user's accessible chat files

### 3. Search Chat Files
- **Endpoint**: `GET /api/chat/files/search`
- **Query Parameters**:
  - `q`: Search query (minimum 2 characters)
  - `type`: File type filter
  - `limit`: Result limit
- **Purpose**: Find files by name or content

### 4. Get File Metadata
- **Endpoint**: `GET /api/chat/files/{fileId}/metadata`
- **Purpose**: Get detailed file information without downloading
- **Response**: Complete metadata including thumbnails, uploader, etc.

## 🔐 Security Features

- **JWT Authentication**: All endpoints require valid JWT token
- **Context Validation**: Only `CHAT_MESSAGE` context files are accessible
- **Access Control**: Users can only access files they have permissions for
- **File Size Limits**: 25MB limit for chat message attachments

## 📱 Flutter Integration

### Typical Flow:
1. **Upload**: Use `/chat/upload` to upload file before sending message
2. **Send Message**: Include returned `fileId` in WebSocket message
3. **Display**: Use `/serve` endpoint for inline display
4. **Download**: Use `/download` for explicit downloads
5. **Thumbnails**: Use `/thumbnails` for fast preview loading

### Example Usage:
```dart
// Upload file
final response = await dio.post('/chat/upload', data: formData);
final fileId = response.data['file']['id'];

// Display in chat
Image.network('$baseUrl/chat/files/$fileId/serve');

// Download file
launch('$baseUrl/chat/files/$fileId/download');
```

## 🧪 Testing with Postman

1. **Authentication**: Login first to get JWT token
2. **Upload File**: Use "Upload Chat File" to get `chatFileId`
3. **Test Serving**: Use serve/download endpoints with the file ID
4. **Browse Files**: Use search and accessible endpoints
5. **Check Metadata**: Verify file information

## 📋 Variables Added to Collection

- `chatFileId`: Automatically set when uploading files
- Used throughout the collection for testing file operations

## 🔄 Next Steps

These endpoints are ready for:
- WebSocket integration (Task 4)
- Enhanced access control (Task 5)
- Performance optimization (Task 6)
- Comprehensive testing (Task 7)
