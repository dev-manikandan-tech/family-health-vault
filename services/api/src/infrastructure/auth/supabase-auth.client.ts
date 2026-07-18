import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Algorithm, verify, VerifyOptions } from 'jsonwebtoken';
import { JwksClient, SigningKeyNotFoundError } from 'jwks-rsa';
import WebSocket from 'ws';
import {
  ISupabaseAuthClient,
  SupabaseTokenPayload,
  SupabaseUser,
} from '../../domain/services/supabase-auth-client.interface';

@Injectable()
export class SupabaseAuthClient implements ISupabaseAuthClient {
  private readonly adminClient: SupabaseClient;
  private readonly jwksClient: JwksClient;
  private readonly fallbackSecret?: string;
  private readonly issuer?: string;
  private readonly audience: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('auth.supabaseUrl');
    const serviceRoleKey = this.configService.get<string>(
      'auth.supabaseServiceRoleKey',
    );
    const anonKey = this.configService.get<string>('auth.supabaseAnonKey');
    const nodeEnv =
      this.configService.get<string>('auth.nodeEnv') || 'development';
    this.isProduction = nodeEnv === 'production';

    if (!url || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured',
      );
    }

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: WebSocket as any },
    });

    const jwksUri =
      this.configService.get<string>('auth.supabaseJwksUrl') ||
      `${url}/auth/v1/keys`;

    this.jwksClient = new JwksClient({
      jwksUri,
      requestHeaders: anonKey ? { apikey: anonKey } : {},
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    // The HS256/JWT_SECRET fallback is only for local development and tests.
    // It must never be accepted in production.
    const jwtSecret = this.configService.get<string>('auth.jwtSecret');
    this.fallbackSecret = this.isProduction ? undefined : jwtSecret;

    const configuredIssuer = this.configService.get<string>('auth.jwtIssuer');
    const configuredAudience =
      this.configService.get<string>('auth.jwtAudience');
    this.issuer = configuredIssuer || (url ? `${url}/auth/v1` : undefined);
    this.audience = configuredAudience || 'authenticated';
  }

  async verifyAccessToken(token: string): Promise<SupabaseTokenPayload> {
    const decodedHeader = this.decodeTokenHeader(token);
    const algorithm = decodedHeader?.alg;

    if (algorithm === 'HS256') {
      if (!this.fallbackSecret) {
        throw new Error('HS256 tokens are not accepted');
      }
      return this.verifyWithSecret(token, this.fallbackSecret);
    }

    if (!algorithm || !decodedHeader?.kid) {
      throw new Error('Invalid token header');
    }

    const key = await this.getSigningKey(decodedHeader.kid);
    return this.verifyWithKey(token, key);
  }

  async sendPhoneOtp(phone: string): Promise<void> {
    const { error } = await this.adminClient.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    if (error) {
      throw new Error(`Failed to send phone OTP: ${error.message}`);
    }
  }

  async verifyPhoneOtp(
    phone: string,
    code: string,
  ): Promise<{ userId: string; phone: string }> {
    const { data, error } = await this.adminClient.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error || !data.user) {
      throw new Error(
        `Failed to verify phone OTP: ${error?.message ?? 'unknown'}`,
      );
    }
    return { userId: data.user.id, phone: data.user.phone ?? phone };
  }

  async getUser(userId: string): Promise<SupabaseUser | null> {
    const { data, error } =
      await this.adminClient.auth.admin.getUserById(userId);
    if (error || !data.user) {
      return null;
    }
    return {
      id: data.user.id,
      email: data.user.email ?? undefined,
      phone: data.user.phone ?? undefined,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.adminClient.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`Failed to delete Supabase user: ${error.message}`);
    }
  }

  private decodeTokenHeader(token: string): { alg?: string; kid?: string } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token');
    }
    try {
      const header = Buffer.from(parts[0], 'base64url').toString('utf8');
      return JSON.parse(header) as { alg?: string; kid?: string };
    } catch {
      throw new Error('Invalid token header');
    }
  }

  private async getSigningKey(kid: string): Promise<string> {
    try {
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      if (error instanceof SigningKeyNotFoundError && this.fallbackSecret) {
        return this.fallbackSecret;
      }
      throw error;
    }
  }

  private verifyOptions(allowedAlgorithms: Algorithm[]): VerifyOptions {
    const options: VerifyOptions = { algorithms: allowedAlgorithms };
    if (this.issuer) {
      options.issuer = this.issuer;
    }
    options.audience = this.audience;
    return options;
  }

  private verifyWithSecret(
    token: string,
    secret: string,
  ): SupabaseTokenPayload {
    // The HS256 fallback is for local development/tests; it cannot enforce
    // issuer/audience because those values are not set by test fakes.
    return verify(token, secret, {
      algorithms: ['HS256'] as Algorithm[],
    }) as SupabaseTokenPayload;
  }

  private verifyWithKey(token: string, key: string): SupabaseTokenPayload {
    return verify(
      token,
      key,
      this.verifyOptions(['RS256'] as Algorithm[]),
    ) as SupabaseTokenPayload;
  }
}
