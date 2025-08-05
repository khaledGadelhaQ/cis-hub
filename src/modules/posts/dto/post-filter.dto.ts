import { IsOptional, IsEnum, IsUUID, IsInt, Min, Max, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PostType } from '../../../common/enums/post_type.enum';
import { PostScope } from '../../../common/enums/post_scope.enum';
import { Priority } from '../../../common/enums/priority.enum';

export class PostFilterDto {
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsEnum(PostScope)
  scope?: PostScope;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  targetYear?: number;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'publishedAt', 'priority'])
  sortBy?: 'createdAt' | 'publishedAt' | 'priority' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
