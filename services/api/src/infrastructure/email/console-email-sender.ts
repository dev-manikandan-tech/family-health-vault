import { Injectable } from '@nestjs/common';
import { IEmailSender } from '../../domain/services/email-sender.interface';

@Injectable()
export class ConsoleEmailSender implements IEmailSender {
  async sendOtp(email: string, _code: string): Promise<void> {
    console.log(`[OTP] code sent to ${email}`);
  }

  async sendPasswordReset(email: string, _token: string): Promise<void> {
    console.log(`[PASSWORD RESET] token sent to ${email}`);
  }
}
