import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ITokenStore } from '../../domain/services/token-store.interface';
import { IPasswordResetService } from '../../domain/services/password-reset-service.interface';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { TOKEN_STORE } from '../../domain/constants/injection-tokens';

@Injectable()
export class PasswordResetService implements IPasswordResetService {
  private readonly TTL_SECONDS = 600;

  constructor(@Inject(TOKEN_STORE) private readonly tokenStore: ITokenStore) {}

  async generateToken(email: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.tokenStore.set(
      this.tokenKey(token),
      email.toLowerCase(),
      this.TTL_SECONDS,
    );
    return token;
  }

  async validateToken(token: string): Promise<string> {
    const email = await this.tokenStore.get(this.tokenKey(token));
    if (!email) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid or expired password reset token',
      );
    }
    await this.tokenStore.delete(this.tokenKey(token));
    return email;
  }

  private tokenKey(token: string): string {
    return `password-reset:${token}`;
  }
}
