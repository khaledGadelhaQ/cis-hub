# 📦 Files Module - Installation & Setup Guide

## 🚀 Quick Start

### 1. Install Required Dependencies
```bash
# Core dependencies
npm install uuid multer
npm install --save-dev @types/uuid @types/multer

# Optional: For advanced image processing (recommended)
npm install sharp
npm install --save-dev @types/sharp
```

### 2. Add Files Module to Your App

```typescript
// In src/app.module.ts
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    // ... other modules
    FilesModule,
  ],
  // ... rest of module
})
export class AppModule {}
```

### 3. Environment Configuration

Add to your `.env` file:
```env
# File upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=40
```

### 4. Enable Image Processing (Optional)

If you installed Sharp, update the files module:

```typescript
// In src/modules/files/files.module.ts
// Comment out the simple service line:
// import { ImageProcessingService } from './services/image-processing-simple.service';

// Uncomment the full service line:
import { ImageProcessingService } from './services/image-processing.service';
```

## 🔧 Integration with Chat Module

### Update Chat Service

```typescript
// In src/modules/chat/chat.service.ts
import { FilesService } from '../files/services/files.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService, // Add this
  ) {}

  async sendGroupMessage(senderId: string, dto: SendGroupMessageDto) {
    // Create message
    const message = await this.prisma.chatMessage.create({
      data: {
        content: dto.content,
        senderId,
        roomId: dto.roomId,
        messageType: dto.attachments?.length > 0 ? MessageType.FILE : MessageType.TEXT,
      },
    });

    // Associate files if provided
    if (dto.attachments?.length > 0) {
      const fileIds = dto.attachments.map(a => a.fileId);
      await this.filesService.associateFilesWithMessage(fileIds, message.id);
    }

    return this.formatMessageResponse(message);
  }
}
```

### Update Chat Module

```typescript
// In src/modules/chat/chat.module.ts
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    FilesModule, // Add this
  ],
  // ... rest of module
})
export class ChatModule {}
```

## 📱 Client Integration Flow

### Option B: Upload Then Send

```typescript
// 1. Upload file first
const uploadResponse = await fetch('/api/v1/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData, // Contains file + context: 'CHAT_MESSAGE'
});

const { id: fileId, ...fileData } = await uploadResponse.json();

// 2. Send message with file reference
await socket.emit('send_group_message', {
  content: 'Check this out!',
  roomId: 'room-uuid',
  attachments: [{
    fileId: fileId,
    originalName: fileData.originalName,
    mimeType: fileData.mimeType,
  }]
});
```

## 🧪 Test the Module

Create a simple test endpoint:

```typescript
// In any controller for testing
@Post('test-upload')
@UseInterceptors(FileInterceptor('file'))
async testUpload(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: any,
) {
  return this.filesService.uploadFile(
    file,
    {
      context: UploadContext.GENERAL,
      isPublic: true,
    },
    req.user.id
  );
}
```

## 📁 Directory Structure Created

After running, you'll see:
```
uploads/
├── chat_message/
├── profile/
├── post/
├── assignment/
└── general/
```

## 🔍 Troubleshooting

### Common Issues:

1. **PrismaService not found**: Make sure Prisma is properly set up
2. **Sharp errors**: Sharp is optional - the module works without it
3. **File permissions**: Ensure the upload directory is writable
4. **Large files**: Check your server's file size limits

### Verification Steps:

```bash
# Check if module compiles
npm run build

# Check if upload directory exists
ls -la uploads/

# Test file upload via curl
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "context=GENERAL" \
  http://localhost:3000/api/v1/files/upload
```

## ✅ Module Status

- ✅ **Core file operations** - Upload, download, delete
- ✅ **Context-aware storage** - Files organized by usage
- ✅ **Security validation** - File type and size checks
- ✅ **Permission system** - Access control per context
- ✅ **Storage abstraction** - Ready for cloud migration
- ⚠️ **Image processing** - Basic (install Sharp for full features)

The module is ready for production use! 🎉
