import { IsString, IsUUID } from 'class-validator';

export class ProfessorAssignedEventDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  professorId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  courseName: string;

  @IsString()
  courseCode: string;

  @IsString()
  classNumber: string;

  @IsString()
  professorFirstName: string;

  @IsString()
  professorLastName: string;
}

export class ProfessorRemovedEventDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  professorId: string;

  @IsUUID()
  courseId: string;
}
