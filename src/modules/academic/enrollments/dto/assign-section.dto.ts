import { IsString, IsNotEmpty } from 'class-validator';

export class AssignSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionId: string;
}
