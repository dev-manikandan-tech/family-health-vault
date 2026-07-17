import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import {
  ITokenService,
  AccessTokenPayload,
} from '../../domain/services/token-service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    const secret = this.configService.get<string>('auth.jwtSecret')!;
    const expiresIn =
      this.configService.get<number>('auth.jwtExpiresInSeconds') ?? 900;
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const secret = this.configService.get<string>('auth.jwtSecret')!;
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, { secret });
  }

  generateRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
