import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { PostType } from '../../../common/enums/post_type.enum';
import { PostScope } from '../../../common/enums/post_scope.enum';
import { Priority } from '../../../common/enums/priority.enum';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsEnum(PostType)
  postType: PostType;

  @IsEnum(PostScope)
  scope: PostScope;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  targetYear?: number;

  @IsEnum(Priority)
  priority: Priority;

  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachmentIds?: string[];
}
