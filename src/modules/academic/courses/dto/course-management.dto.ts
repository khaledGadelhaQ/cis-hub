import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';

export class CreateCourseSectionDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsInt()
  @Min(1)
  sectionNumber: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  maxStudents?: number = 40;

  @IsOptional()
  @IsString()
  taId?: string;
}

export class CreateCourseClassDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsInt()
  @Min(1)
  classNumber: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  maxStudents?: number;
}

export class CreateCourseScheduleDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

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

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @IsNotEmpty()
  type: 'LECTURE' | 'LAB' | 'SECTION';

  @IsOptional()
  @IsString()
  instructorId?: string;
}
