import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordResetService {
  constructor() {}

  async forgotPassword(email: string): Promise<void> {
    //TODO: Implement logic to send a password reset email
    // This should generate a token, save it in the database, and send an email with the reset link
    // also enabling rate limiting and throttling
    //HINT: use BullMQ for emails queueing
    // HINT: use Redis for caching
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<void> {
    //TODO: Implement logic to reset the password
    // This should validate the token, check if it exists in the database, and then update the user's password
    // Also, ensure that the new password and confirm password match
    // HINT: use PasswordService to hash the new password
  }
}
