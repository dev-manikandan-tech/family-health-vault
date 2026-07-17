import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import {
  IIdentityProvider,
  SocialProfile,
} from '../../domain/services/identity-provider.interface';

@Injectable()
export class GoogleIdentityProvider implements IIdentityProvider {
  constructor(private readonly configService: ConfigService) {}

  async verifySocialToken(
    _provider: 'google',
    token: string,
  ): Promise<SocialProfile> {
    const clientId = this.configService.get<string>('auth.googleClientId');
    if (!clientId) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'Google client ID not configured',
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid Google ID token',
      );
    }

    return {
      provider: 'google',
      providerUserId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
