import { Injectable } from '@nestjs/common';
import { IEmailSender } from '../../src/domain/services/email-sender.interface';

@Injectable()
export class CapturingEmailSender implements IEmailSender {
  lastOtp?: { email: string; code: string };
  lastPasswordReset?: { email: string; token: string };

  async sendOtp(email: string, code: string): Promise<void> {
    this.lastOtp = { email, code };
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    this.lastPasswordReset = { email, token };
  }

  reset(): void {
    this.lastOtp = undefined;
    this.lastPasswordReset = undefined;
  }
}
