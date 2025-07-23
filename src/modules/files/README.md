# 🗂️ **Centralized File Module - Integration Guide**

## 📋 **Module Overview**

The Files Module provides a centralized, context-aware file management system that can be used across all parts of your application (chat, posts, profile pictures, etc.).

### **Key Features:**
- ✅ **Context-Aware Storage** - Files are organized by their usage context
- ✅ **Security & Validation** - File type and size validation per context
- ✅ **Image Processing** - Automatic thumbnail generation and optimization
- ✅ **Permission System** - Access control based on context and ownership
- ✅ **Storage Abstraction** - Easy to switch between local/S3/cloud storage
- ✅ **Bulk Operations** - Efficient handling of multiple files

## 🏗️ **Architecture Components**

### **Services:**
- **FilesService** - Main business logic and file operations
- **StorageService** - File storage (local/cloud) abstraction
- **FileValidationService** - Context-specific validation rules  
- **ImageProcessingService** - Thumbnail generation and image optimization

### **Key Endpoints:**
- `POST /api/v1/files/upload` - Upload files with context
- `GET /api/v1/files/:id/stream` - Stream/serve files
- `GET /api/v1/files` - List files with filters
- `DELETE /api/v1/files/:id` - Delete files

## 🔌 **Integration Examples**

### **1. For Chat Messages (Option B Implementation):**

```typescript
// In chat.service.ts
import { FilesService } from '../files/services/files.service';

@Injectable()
export class ChatService {
  constructor(
    private filesService: FilesService,
    // ... other services
  ) {}

  async sendGroupMessage(senderId: string, dto: SendGroupMessageDto) {
    // 1. Create message first
    const message = await this.prisma.chatMessage.create({
      data: {
        content: dto.content,
        senderId,
        roomId: dto.roomId,
        messageType: dto.attachments?.length > 0 ? 'FILE' : 'TEXT',
      },
    });

    // 2. Associate files if provided
    if (dto.attachments?.length > 0) {
      const fileIds = dto.attachments.map(a => a.fileId);
      await this.filesService.associateFilesWithMessage(fileIds, message.id);
    }

    return message;
  }
}
```

### **2. For Profile Pictures:**

```typescript
// In users.service.ts
import { FilesService } from '../files/services/files.service';
import { UploadContext } from '../../common/enums/upload_context.enum';

@Injectable()
export class UsersService {
  constructor(
    private filesService: FilesService,
    // ... other services
  ) {}

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // Upload with PROFILE context
    const uploadedFile = await this.filesService.uploadFile(
      file,
      { 
        context: UploadContext.PROFILE,
        contextId: userId,
        isPublic: true, // Profile pics are usually public
      },
      userId
    );

    // Update user profile
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: uploadedFile.filePath },
    });

    return uploadedFile;
  }
}
```

### **3. For Posts/Events (Future Implementation):**

```typescript
// In posts.service.ts (when implemented)
async createPost(userId: string, dto: CreatePostDto) {
  const post = await this.prisma.post.create({
    data: {
      title: dto.title,
      content: dto.content,
      authorId: userId,
    },
  });

  // Associate uploaded files
  if (dto.attachmentIds?.length > 0) {
    await this.prisma.file.updateMany({
      where: { id: { in: dto.attachmentIds } },
      data: { contextId: post.id },
    });
  }

  return post;
}
```

## 🚀 **Setup Instructions**

### **1. Install Dependencies:**
```bash
npm install sharp uuid
npm install --save-dev @types/uuid
```

### **2. Add to App Module:**
```typescript
// In app.module.ts
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    // ... other modules
    FilesModule,
  ],
})
export class AppModule {}
```

### **3. Update Chat Module:**
```typescript
// In chat.module.ts
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    FilesModule, // Import to use FilesService
  ],
  // ... rest of module
})
export class ChatModule {}
```

### **4. Environment Variables:**
```env
# .env
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=40
```

## 📱 **Client Integration (Flutter)**

### **Option B Flow - Upload then Send:**
```dart
// 1. Upload file first
final response = await uploadFile(file, context: 'CHAT_MESSAGE');
final fileId = response['id'];

// 2. Send message with fileId
await sendMessage({
  'content': 'Check this out!',
  'roomId': roomId,
  'attachments': [
    {
      'fileId': fileId,
      'originalName': file.name,
      'mimeType': file.mimeType,
    }
  ]
});
```

## 🔒 **Security Features**

### **Context-Based Validation:**
- **Chat Messages**: 40MB limit, supports images/documents/archives
- **Profile Pictures**: 5MB limit, images only
- **Posts**: 20MB limit, images/videos/PDFs
- **Assignments**: 100MB limit, documents only

### **Access Control:**
- Files are private by default
- Context-specific access validation
- Only file owners and authorized users can access
- Room membership validation for chat files

## 📊 **File Organization**

Files are automatically organized by:
```
uploads/
├── chat_message/
│   ├── 2025-07/
│   │   ├── uuid-file1.jpg
│   │   └── thumbnails/
│   │       ├── uuid-file1_small_150x150.jpg
│   │       ├── uuid-file1_medium_300x300.jpg
│   │       └── uuid-file1_large_600x600.jpg
├── profile/
│   └── 2025-07/
│       └── uuid-avatar.png
└── post/
    └── 2025-07/
        └── uuid-attachment.pdf
```

## 🎯 **Next Steps**

1. ✅ **Add FilesModule to your AppModule**
2. ✅ **Install required dependencies** 
3. ✅ **Update ChatService to use FilesService**
4. ✅ **Update DTO validation in chat gateways**
5. ✅ **Test file upload and association**
6. ⏳ **Implement front-end integration**

This centralized approach ensures consistency, security, and reusability across your entire application! 🚀
