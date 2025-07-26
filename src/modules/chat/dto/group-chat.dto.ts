import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min, Max, IsUUID, MaxLength, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageContentType, FileAttachmentDto } from './private-chat.dto';

export class JoinGroupDto {
  @IsUUID()
  roomId: string;
}

export class SendGroupMessageDto {
  @ValidateIf(o => !o.attachments || o.attachments.length === 0)
  @IsString()
  @MaxLength(5000)
  content?: string; // Required if no attachments

  @IsUUID()
  roomId: string;

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

export class GetGroupMessagesDto {
  @IsString()
  roomId: string;

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

export class MarkMessagesReadDto {
  @IsUUID()
  roomId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  messageIds: string[];
}

// Room management DTOs - used for joining/leaving chat rooms
export class JoinRoomDto {
  @IsUUID()
  roomId: string;
}

export class LeaveRoomDto {
  @IsUUID()
  roomId: string;
}

export class RoomInfoDto {
  id: string;
  name: string;
  description?: string;
  type: string;
  memberCount: number;
  isMessagingEnabled: boolean;
  slowModeSeconds?: number;
}
