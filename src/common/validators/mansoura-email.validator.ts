import { BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class MansouraEmailConstraint implements ValidatorConstraintInterface {
  private readonly MANSOURA_EMAIL_DOMAIN = '@std.mans.edu.eg';
  validate(email: string, args: ValidationArguments) {
    if (!email) return false;

    const trimmedEmail = email.trim().toLowerCase();

    if (
      !this.isValidEmail(trimmedEmail) ||
      !this.isMansouraEmail(trimmedEmail)
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email must be a valid Mansoura University email ending with @std.mans.edu.eg';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isMansouraEmail(email: string): boolean {
    return email.endsWith(this.MANSOURA_EMAIL_DOMAIN);
  }
}

export function IsMansouraEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MansouraEmailConstraint,
    });
  };
}
