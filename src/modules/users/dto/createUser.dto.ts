import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  IsBoolean, 
  IsEnum, 
  IsInt, 
  MinLength, 
  MaxLength,
  IsPhoneNumber,
  IsUrl,
  IsOptional
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/enums/user_role.enum';
import { IsMansouraEmail } from '../../../common/validators/mansoura-email.validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsMansouraEmail({
    message: 'Email must be a Mansoura University email ending with @std.mans.edu.eg',
  })
  email: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must be less than 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must be less than 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsString({ message: 'College ID must be a string' })
  @IsNotEmpty({ message: 'College ID is required' })
  @MinLength(5, { message: 'College ID must be at least 5 characters long' })
  @MaxLength(20, { message: 'College ID must be less than 20 characters' })
  collegeId: string;

  @IsOptional()
  @IsPhoneNumber('EG', { message: 'Invalid Egyptian phone number format' })
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Profile image URL must be a valid URL' })
  profileImageUrl?: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'User role is required' })
  role: UserRole;

  @IsOptional()
  @IsInt({ message: 'Current year must be an integer' })
  @Transform(({ value }) => parseInt(value))
  currentYear?: number;

  @IsOptional()
  @IsString({ message: 'Department ID must be a string' })
  departmentId?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'isEmailVerified must be a boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isEmailVerified?: boolean = false;

  @IsOptional()
  @IsBoolean({ message: 'mustChangePassword must be a boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  mustChangePassword?: boolean = true;
}
