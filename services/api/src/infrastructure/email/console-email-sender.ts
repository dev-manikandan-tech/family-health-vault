import { Injectable } from '@nestjs/common';
import { IEmailSender } from '../../domain/services/email-sender.interface';

@Injectable()
export class ConsoleEmailSender implements IEmailSender {
  async sendOtp(email: string, code: string): Promise<void> {
    console.log(`[OTP] to ${email}: ${code}`);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    console.log(`[PASSWORD RESET] to ${email}: ${token}`);
  }
}
