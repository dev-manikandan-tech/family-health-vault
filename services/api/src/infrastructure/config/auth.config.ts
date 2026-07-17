import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
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
