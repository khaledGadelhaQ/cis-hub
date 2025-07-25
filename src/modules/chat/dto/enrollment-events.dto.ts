import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { EnrollmentRole } from '../../../common/enums/enrollment_role.enum';

export class EnrollmentCreatedEventDto {
  @IsUUID()
  enrollmentId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsEnum(EnrollmentRole)
  role: EnrollmentRole;

  @IsString()
  userFirstName: string;

  @IsString()
  userLastName: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  @IsOptional()
  classNumber?: string;

  @IsString()
  @IsOptional()
  sectionNumber?: string;
}

export class EnrollmentRemovedEventDto {
  @IsUUID()
  enrollmentId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsEnum(EnrollmentRole)
  role: EnrollmentRole;
}
