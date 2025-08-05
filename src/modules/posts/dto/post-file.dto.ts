import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class PostFileUploadDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PostFileAttachmentDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(10)
  fileIds?: string[];
}

export class BulkFileAssociationDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(10)
  fileIds: string[];
}

export class PostFileQueryDto {
  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: 'uploadedAt' | 'fileSize' | 'originalName' = 'uploadedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PostFileStatsDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;
}
