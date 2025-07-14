import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { DepartmentName } from '../../../../common/enums/department_name.enum';
import { DepartmentCode } from '../../../../common/enums/department_code.enum';

export class CreateDepartmentDto {
  @IsEnum(DepartmentName)
  @IsNotEmpty()
  name: DepartmentName;

  @IsEnum(DepartmentCode)
  @IsNotEmpty()
  code: DepartmentCode;

  @IsOptional()
  @IsString()
  description?: string;

}
