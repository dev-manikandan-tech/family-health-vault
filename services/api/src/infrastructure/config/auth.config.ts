import { registerAs } from '@nestjs/config';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production',
    );
  }
  return secret || 'dev-secret-not-for-production';
}

export const authConfig = registerAs('auth', () => ({
  jwtSecret: getJwtSecret(),
  jwtExpiresInSeconds: parseInt(
    process.env.JWT_EXPIRES_IN_SECONDS || '900',
    10,
  ),
  refreshTokenExpiresInDays: parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '7',
    10,
  ),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  appleClientId: process.env.APPLE_CLIENT_ID,
  nodeEnv: process.env.NODE_ENV || 'development',
}));
