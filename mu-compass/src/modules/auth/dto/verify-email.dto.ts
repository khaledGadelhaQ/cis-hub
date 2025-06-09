import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsMansouraEmail } from '../../../common/validators/mansoura-email.validator';

export class VerifyEmailDTO {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsMansouraEmail({
    message:
      'Email must be a Mansoura University email ending with @std.mans.edu.eg',
  })
  email: string;

  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(6, { message: 'OTP must be at least 6 characters long' })
  otp: string;
}
