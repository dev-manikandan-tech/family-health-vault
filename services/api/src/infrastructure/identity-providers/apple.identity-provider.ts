import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import {
  IIdentityProvider,
  SocialProfile,
} from '../../domain/services/identity-provider.interface';

@Injectable()
export class AppleIdentityProvider implements IIdentityProvider {
  private readonly jwks = new JwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
    cache: true,
    rateLimit: true,
  });

  constructor(private readonly configService: ConfigService) {}

  async verifySocialToken(
    _provider: 'apple',
    token: string,
  ): Promise<SocialProfile> {
    const clientId = this.configService.get<string>('auth.appleClientId');
    if (!clientId) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'Apple client ID not configured',
      );
    }

    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Invalid Apple token format',
        );
      }

      const kid = decoded.header.kid;
      const key = await this.jwks.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: clientId,
        issuer: 'https://appleid.apple.com',
      }) as jwt.JwtPayload;

      if (!payload || !payload.email) {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Invalid Apple token payload',
        );
      }

      return {
        provider: 'apple',
        providerUserId: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string | undefined,
      };
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        `Apple token verification failed: ${(error as Error).message}`,
      );
    }
  }
}
