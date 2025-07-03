import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(6)
  creditHours: number;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsInt()
  @Min(1)
  @Max(4)
  targetYear: number;

  @IsString()
  @IsNotEmpty()
  semesterId: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  maxStudentsPerSection?: number = 40;
}
