// src/common/pipes/mansoura-email.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MansouraEmailPipe implements PipeTransform {
  private readonly MANSOURA_EMAIL_DOMAIN = '@std.mans.edu.eg';

  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Email is required');
    }

    const email = value.trim().toLowerCase();

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (!this.isMansouraEmail(email)) {
      throw new BadRequestException(
        `Email must be a Mansoura University email ending with ${this.MANSOURA_EMAIL_DOMAIN}`,
      );
    }

    return email;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isMansouraEmail(email: string): boolean {
    return email.endsWith(this.MANSOURA_EMAIL_DOMAIN);
  }
}
