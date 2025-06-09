import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDTO {
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  token: string;

  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @IsString({ message: 'Confirm new password must be a string' })
  @IsNotEmpty({ message: 'Confirm new password is required' })
  @MinLength(8, {
    message: 'Confirm new password must be at least 8 characters long',
  })
  confirmNewPassword: string;
}
