import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EnrollmentRole } from '@prisma/client';

export class EnrollStudentDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsEnum(EnrollmentRole)
  role?: EnrollmentRole = EnrollmentRole.STUDENT;
}
