import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ClassCreatedEventDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  departmentCode: string;

  @IsString()
  targetYear: string;

}

export class ClassUpdatedEventDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  departmentCode: string;

  @IsString()
  targetYear: string;

}

export class ClassDeletedEventDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  courseId: string;
}
