import { IsUUID, IsString, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { UploadContext } from '../../../common/enums/upload_context.enum';

export class ChatFileUploadDto {
  @IsEnum(UploadContext)
  context: UploadContext = UploadContext.CHAT_MESSAGE; // Default to chat context

  @IsOptional()
  @IsUUID()
  contextId?: string; // Will be messageId after message is created

  @IsOptional()
  @IsString()
  description?: string; // Optional file description for chat files
}

export class ChatFileResponseDto {
  id: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  formattedSize: string; // Human-readable size (e.g., "2.5 MB")
  mimeType: string;
  fileCategory: 'image' | 'video' | 'document' | 'audio' | 'other';
  isMobileCameraFormat: boolean; // true for HEIC/HEIF files
  context: UploadContext;
  contextId?: string;
  uploadedAt: Date;
  uploader: {
    id: string;
    name: string;
  };
  thumbnails?: {
    small?: string;   // 150px
    medium?: string;  // 300px
    large?: string;   // 600px
  };
  serveUrl: string; // Direct URL for Flutter app (/files/:id/serve)
}

export class AttachFilesToMessageDto {
  @IsUUID()
  messageId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  fileIds: string[]; // Array of file IDs to attach to the message
}

export class ChatFileMetadataDto {
  @IsUUID()
  fileId: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  fileCategory: 'image' | 'video' | 'document' | 'audio' | 'other';
  
  @IsOptional()
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}
