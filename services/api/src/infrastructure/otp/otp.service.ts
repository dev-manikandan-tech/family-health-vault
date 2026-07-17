import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { ITokenStore } from '../../domain/services/token-store.interface';
import { IOtpService } from '../../domain/services/otp-service.interface';
import { TOKEN_STORE } from '../../domain/constants/injection-tokens';
import { Inject } from '@nestjs/common';

@Injectable()
export class OtpService implements IOtpService {
  private readonly TTL_SECONDS = 300;

  constructor(@Inject(TOKEN_STORE) private readonly tokenStore: ITokenStore) {}

  async generateCode(email: string): Promise<string> {
    const code = randomInt(100000, 999999).toString();
    await this.tokenStore.set(this.key(email), code, this.TTL_SECONDS);
    return code;
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const stored = await this.tokenStore.get(this.key(email));
    if (!stored) return false;
    if (stored !== code) return false;
    await this.tokenStore.delete(this.key(email));
    return true;
  }

  private key(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }
}
