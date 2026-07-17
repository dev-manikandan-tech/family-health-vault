export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

export interface ITokenService {
  generateAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
}
