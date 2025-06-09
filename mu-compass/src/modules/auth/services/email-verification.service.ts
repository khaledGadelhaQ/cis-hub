//TODO
// Email service with Rate limiting and throttling (Redis for caching)
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class EmailVerificationService {
  constructor() {}

  async sendVerificationEmail(email: string): Promise<void> {
    //TODO: Implement email sending logic
  }

  async verifyEmail(email: string, otp: string): Promise<void> {
    //TODO : Implement email verification logic
  }
}
