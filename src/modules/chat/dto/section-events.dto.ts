import { IsString, IsUUID } from 'class-validator';

export class SectionCreatedEventDto {
  @IsUUID()
  sectionId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  taId: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  departmentCode: string;

  @IsString()
  targetYear: string;

  @IsString()
  sectionNumber: string;

  @IsString()
  taFirstName: string;

  @IsString()
  taLastName: string;
}

export class SectionUpdatedEventDto {
  @IsUUID()
  sectionId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  taId: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  departmentCode: string;

  @IsString()
  targetYear: string;

  @IsString()
  sectionNumber: string;

  @IsString()
  taFirstName: string;

  @IsString()
  taLastName: string;

  @IsUUID()
  @IsString()
  previousTaId?: string; // For handling TA changes
}

export class SectionDeletedEventDto {
  @IsUUID()
  sectionId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  taId: string;

  @IsString()
  sectionNumber: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  departmentCode: string;

  @IsString()
  targetYear: string;

  @IsString()
  taFirstName: string;

  @IsString()
  taLastName: string;
}
