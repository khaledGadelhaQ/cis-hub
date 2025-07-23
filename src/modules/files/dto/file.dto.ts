import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, Min, Max, IsArray, ValidateNested, IsIn, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UploadContext } from '../../../common/enums/upload_context.enum';

export class UploadFileDto {
  @IsEnum(UploadContext)
  context: UploadContext;

  @IsOptional()
  @IsUUID()
  contextId?: string; // ID of the entity this file belongs to (messageId, postId, etc.)

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean; // Whether file can be accessed publicly

  @IsOptional()
  @IsString()
  description?: string; // Optional file description
}

export class FileMetadataDto {
  @IsUUID()
  fileId: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  fileSize: number;

  @IsEnum(UploadContext)
  context: UploadContext;

  @IsOptional()
  @IsUUID()
  contextId?: string;
}

export class FileQueryDto {
  @IsOptional()
  @IsEnum(UploadContext)
  context?: UploadContext;

  @IsOptional()
  @IsUUID()
  contextId?: string;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class ProcessImageDto {
  @IsUUID()
  fileId: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  sizes?: number[]; // [150, 300, 600] - generate thumbnails

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number = 80;

  @IsOptional()
  @IsString()
  @IsIn(['jpeg', 'png', 'webp'])
  format?: string;
}

export class FileResponseDto {
  id: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  context: UploadContext;
  contextId?: string;
  isPublic: boolean;
  uploadedAt: Date;
  uploader: {
    id: string;
    name: string;
  };
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  // Mobile-specific fields
  fileCategory?: 'image' | 'video' | 'document' | 'audio' | 'other';
  isMobileCameraFormat?: boolean;
  serveUrl?: string;
  formattedSize?: string;
}

// Bulk file operations
export class BulkFileOperationDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  fileIds: string[];

  @IsOptional()
  @IsUUID()
  newContextId?: string; // For moving files to different context
}

// File sharing/access control
export class FileAccessDto {
  @IsUUID()
  fileId: string;

  @IsBoolean()
  isPublic: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  allowedUsers?: string[]; // Specific users who can access
}
