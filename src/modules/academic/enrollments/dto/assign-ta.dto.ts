import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class AssignTaDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  taId: string;

  @IsArray()
  @IsString({ each: true })
  sectionIds: string[];
}
