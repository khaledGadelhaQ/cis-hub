import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDTO } from '../dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { MansouraEmailPipe } from 'src/common/pipes/mansoura-email.pipe';
import { VerifyEmailDTO } from '../dto/verify-email.dto';
import { ChangepasswordDTO } from '../dto/change-password.dto';
import { ResetPasswordDTO } from '../dto/reset-password.dto';
import { User } from '@prisma/client';
import { EmailVerificationService } from '../services/email-verification.service';
import { PasswordResetService } from '../services/password-reset.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('send-verification')
  async sendVerificationEmail(@Body('email', MansouraEmailPipe) email: string) {
    return this.emailVerificationService.sendVerificationEmail(email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDTO) {
    return this.emailVerificationService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.otp,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangepasswordDTO,
    @Req() req,
  ) {
    return this.authService.changePassword(req.user.email, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email', MansouraEmailPipe) email: string) {
    return this.passwordResetService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      resetPasswordDto.confirmNewPassword,
    );
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user as User);
  }
}
