import { 
  IsEmail, 
  IsOptional, 
  IsString, 
  IsBoolean, 
  IsEnum, 
  IsInt, 
  MinLength, 
  MaxLength,
  IsPhoneNumber,
  IsUrl
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/enums/user_role.enum';
import { IsMansouraEmail } from '../../../common/validators/mansoura-email.validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsMansouraEmail({
    message: 'Email must be a Mansoura University email ending with @std.mans.edu.eg',
  })
  email?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must be less than 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must be less than 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'College ID must be a string' })
  @MinLength(5, { message: 'College ID must be at least 5 characters long' })
  @MaxLength(20, { message: 'College ID must be less than 20 characters' })
  collegeId?: string;

  @IsOptional()
  @IsPhoneNumber('EG', { message: 'Invalid Egyptian phone number format' })
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Profile image URL must be a valid URL' })
  profileImageUrl?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;

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
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isEmailVerified must be a boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'mustChangePassword must be a boolean' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  mustChangePassword?: boolean;

  // Optional: New password (if admin wants to reset user password)
  @IsOptional()
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be less than 128 characters' })
  newPassword?: string;

  // Additional admin-only fields
  @IsOptional()
  @IsInt({ message: 'Login attempts must be an integer' })
  @Transform(({ value }) => parseInt(value))
  loginAttempts?: number;

  @IsOptional()
  lockedUntil?: Date;
}