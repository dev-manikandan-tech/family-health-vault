import { Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import {
  IIdentityProvider,
  SocialProfile,
} from '../../domain/services/identity-provider.interface';

@Injectable()
export class FakeIdentityProvider implements IIdentityProvider {
  private readonly validTokens: Map<string, SocialProfile> = new Map();

  registerToken(
    provider: 'google' | 'apple',
    token: string,
    profile: SocialProfile,
  ): void {
    this.validTokens.set(`${provider}:${token}`, profile);
  }

  async verifySocialToken(
    provider: 'google' | 'apple',
    token: string,
  ): Promise<SocialProfile> {
    const profile = this.validTokens.get(`${provider}:${token}`);
    if (!profile) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid social token (test mode)',
      );
    }
    return profile;
  }
}
