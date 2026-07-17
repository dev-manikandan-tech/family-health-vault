import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import {
  ISupabaseAuthClient,
  SupabaseTokenPayload,
  SupabaseUser,
} from '../../src/domain/services/supabase-auth-client.interface';

@Injectable()
export class FakeSupabaseAuthClient implements ISupabaseAuthClient {
  private readonly users = new Map<string, SupabaseUser>();
  private readonly otps = new Map<string, string>();

  constructor(
    private readonly secret: string = 'test-secret-not-for-production',
  ) {}

  signToken(payload: SupabaseTokenPayload): string {
    return sign(payload, this.secret, { algorithm: 'HS256' });
  }

  async verifyAccessToken(token: string): Promise<SupabaseTokenPayload> {
    return verify(token, this.secret, {
      algorithms: ['HS256'],
    }) as SupabaseTokenPayload;
  }

  async sendPhoneOtp(phone: string): Promise<void> {
    this.otps.set(phone, '123456');
  }

  async verifyPhoneOtp(
    phone: string,
    code: string,
  ): Promise<{ userId: string; phone: string }> {
    const expected = this.otps.get(phone);
    if (expected !== code) {
      throw new Error('Invalid OTP');
    }
    const userId = `phone-user-${phone}`;
    this.users.set(userId, { id: userId, phone });
    return { userId, phone };
  }

  async getUser(userId: string): Promise<SupabaseUser | null> {
    return this.users.get(userId) ?? null;
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  registerUser(user: SupabaseUser): void {
    this.users.set(user.id, user);
  }

  resetOtps(): void {
    this.otps.clear();
  }
}
