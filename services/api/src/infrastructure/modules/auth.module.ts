import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig } from '../config/auth.config';
import { DatabaseModule } from '../database/database.module';
import { UserOrmEntity } from '../orm/entities/user.orm-entity';
import { RefreshTokenOrmEntity } from '../orm/entities/refresh-token.orm-entity';
import { DeviceSessionOrmEntity } from '../orm/entities/device-session.orm-entity';
import { TypeOrmUserRepository } from '../orm/repositories/user.typeorm.repository';
import { TypeOrmRefreshTokenRepository } from '../orm/repositories/refresh-token.typeorm.repository';
import { TypeOrmDeviceSessionRepository } from '../orm/repositories/device-session.typeorm.repository';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher';
import { JwtTokenService } from '../security/jwt-token.service';
import { JwtStrategy } from '../security/jwt.strategy';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { RlsContextService } from '../security/rls-context.service';
import { RlsInterceptor } from '../security/rls.interceptor';
import { AuthApplicationService } from '../../application/services/auth-application.service';
import { AuthController } from '../../interface/controllers/auth.controller';
import { GoogleIdentityProvider } from '../identity-providers/google.identity-provider';
import { AppleIdentityProvider } from '../identity-providers/apple.identity-provider';
import { FakeIdentityProvider } from '../identity-providers/fake.identity-provider';
import { IdentityProviderFactory } from '../identity-providers/identity-provider.factory';
import { OtpService } from '../otp/otp.service';
import { PasswordResetService } from '../password-reset/password-reset.service';
import { ConsoleEmailSender } from '../email/console-email-sender';
import { InMemoryTokenStore } from '../rate-limiter/token-store/in-memory-token.store';
import { RedisTokenStore } from '../rate-limiter/token-store/redis-token.store';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { RateLimitGuard } from '../rate-limiter/rate-limit.guard';
import {
  USER_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  IDENTITY_PROVIDER,
  OTP_SERVICE,
  PASSWORD_RESET_SERVICE,
  EMAIL_SENDER,
  TOKEN_STORE,
  RATE_LIMITER_SERVICE,
} from '../../domain/constants/injection-tokens';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret')!,
        signOptions: {
          expiresIn: config.get<number>('auth.jwtExpiresInSeconds') ?? 900,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RefreshTokenOrmEntity,
      DeviceSessionOrmEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    RlsContextService,
    RlsInterceptor,
    RateLimiterService,
    RateLimitGuard,
    AuthApplicationService,
    GoogleIdentityProvider,
    AppleIdentityProvider,
    FakeIdentityProvider,
    IdentityProviderFactory,
    OtpService,
    PasswordResetService,
    ConsoleEmailSender,
    InMemoryTokenStore,
    RedisTokenStore,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: DEVICE_SESSION_REPOSITORY,
      useClass: TypeOrmDeviceSessionRepository,
    },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: OTP_SERVICE, useClass: OtpService },
    { provide: PASSWORD_RESET_SERVICE, useClass: PasswordResetService },
    { provide: EMAIL_SENDER, useClass: ConsoleEmailSender },
    { provide: RATE_LIMITER_SERVICE, useClass: RateLimiterService },
    {
      provide: TOKEN_STORE,
      useFactory: (
        config: ConfigService,
        redis: RedisTokenStore,
        memory: InMemoryTokenStore,
      ) => {
        return config.get<string>('REDIS_URL') ? redis : memory;
      },
      inject: [ConfigService, RedisTokenStore, InMemoryTokenStore],
    },
    {
      provide: IDENTITY_PROVIDER,
      useFactory: (factory: IdentityProviderFactory) => ({
        verifySocialToken: (provider: 'google' | 'apple', token: string) =>
          factory.get(provider).verifySocialToken(provider, token),
      }),
      inject: [IdentityProviderFactory],
    },
  ],
  exports: [
    JwtAuthGuard,
    RlsContextService,
    RlsInterceptor,
    RateLimitGuard,
    RateLimiterService,
  ],
})
export class AuthModule {}
