import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsArray, ValidateNested, IsEnum, IsNumber, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageContentType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  MIXED = 'MIXED', // Text with file attachments
}

export class FileAttachmentDto {
  @IsUUID()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  mimeType: string;
}

export class SendPrivateMessageDto {
  @ValidateIf(o => !o.attachments || o.attachments.length === 0)
  @IsString()
  @MaxLength(5000)
  content?: string; // Required if no attachments

  @IsUUID()
  recipientId: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsEnum(MessageContentType)
  messageType?: MessageContentType;

  @ValidateIf(o => !o.content)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  attachments?: FileAttachmentDto[]; // Required if no content
}

export class TypingDto {
  @IsUUID()
  recipientId: string; // For private chat, we specify who we're typing to
  
  @IsOptional()
  isTyping?: boolean; // true = start typing, false = stop typing
}

export class GetPrivateMessagesDto {
  @IsUUID()
  recipientId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string; // ISO timestamp string to start from (e.g., "2025-07-22T18:52:59.000Z")

  @IsOptional()
  @IsString()
  direction?: 'before' | 'after'; // Default: 'before'
}

export class MessageResponseDto {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  roomId: string;
  messageType: string;
  sentAt: Date;
  isEdited: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  attachments?: Array<{
    id: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    fileCategory: 'image' | 'video' | 'document' | 'audio' | 'other';
    thumbnails?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    serveUrl: string; // Direct URL for accessing the file
  }>;
}

export class TypingIndicatorDto {
  userId: string;
  userName: string;
  isTyping: boolean;
}
