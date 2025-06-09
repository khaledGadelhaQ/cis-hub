import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangepasswordDTO {
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  currentPassword: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  confirmNewPassword: string;
}
