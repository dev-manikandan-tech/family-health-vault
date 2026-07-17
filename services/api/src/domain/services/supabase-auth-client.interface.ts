export interface SupabaseTokenPayload {
  sub: string;
  email?: string;
  phone?: string;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: Record<string, unknown>;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
}

export interface ISupabaseAuthClient {
  verifyAccessToken(token: string): Promise<SupabaseTokenPayload>;
  sendPhoneOtp(phone: string): Promise<void>;
  verifyPhoneOtp(
    phone: string,
    code: string,
  ): Promise<{ userId: string; phone: string }>;
  getUser(userId: string): Promise<SupabaseUser | null>;
  deleteUser(userId: string): Promise<void>;
}
