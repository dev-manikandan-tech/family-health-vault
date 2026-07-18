import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseJwksUrl = process.env.SUPABASE_JWKS_URL;

  if (
    process.env.NODE_ENV === 'production' &&
    (!supabaseUrl || !supabaseServiceRoleKey)
  ) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production',
    );
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseAnonKey,
    supabaseJwksUrl,
    jwtSecret: process.env.JWT_SECRET,
    jwtIssuer: process.env.SUPABASE_JWT_ISSUER,
    jwtAudience: process.env.SUPABASE_JWT_AUDIENCE,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
});
