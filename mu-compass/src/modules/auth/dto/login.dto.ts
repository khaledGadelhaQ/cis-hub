import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsMansouraEmail } from '../../../common/validators/mansoura-email.validator';

export class LoginDTO {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsMansouraEmail({
    message:
      'Email must be a Mansoura University email ending with @std.mans.edu.eg',
  })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
