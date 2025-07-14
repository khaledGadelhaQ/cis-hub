import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, IsEnum } from 'class-validator';
import { EnrollmentRole } from '@prisma/client';

export class CreateCourseClassDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsInt()
  @Min(1)
  classNumber: number;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1=Monday, 7=Sunday

  @IsString()
  @IsNotEmpty()
  startTime: string; // HH:MM format

  @IsString()
  @IsNotEmpty()
  endTime: string; // HH:MM format

  @IsInt()
  @Min(1)
  duration: number; // Duration in minutes

  @IsString()
  @IsNotEmpty()
  location: string; // Room/Building

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  maxStudents?: number = 40;
}

export class CreateCourseSectionDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  taId: string;

  @IsInt()
  @Min(1)
  sectionNumber: number;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1=Monday, 7=Sunday

  @IsString()
  @IsNotEmpty()
  startTime: string; // HH:MM format

  @IsString()
  @IsNotEmpty()
  endTime: string; // HH:MM format

  @IsInt()
  @Min(1)
  duration: number; // Duration in minutes

  @IsString()
  @IsNotEmpty()
  location: string; // Room/Building

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  maxStudents?: number = 40;
}

export class AssignClassProfessorDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  professorId: string;
}

export class CreateCourseEnrollmentDto {
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

  @IsEnum(EnrollmentRole)
  role: EnrollmentRole;
}

// Update DTOs
export class UpdateCourseClassDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  classNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  maxStudents?: number;
}

export class UpdateCourseSectionDto {
  @IsOptional()
  @IsString()
  taId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sectionNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  maxStudents?: number;
}
