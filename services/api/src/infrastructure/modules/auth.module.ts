import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authConfig } from '../config/auth.config';
import { DatabaseModule } from '../database/database.module';
import { UserOrmEntity } from '../orm/entities/user.orm-entity';
import { DeviceSessionOrmEntity } from '../orm/entities/device-session.orm-entity';
import { AuditLogOrmEntity } from '../orm/entities/audit-log.orm-entity';
import { TypeOrmUserRepository } from '../orm/repositories/user.typeorm.repository';
import { TypeOrmDeviceSessionRepository } from '../orm/repositories/device-session.typeorm.repository';
import { AuditLogTypeOrmRepository } from '../orm/repositories/audit-log.typeorm.repository';
import { SupabaseAuthClient } from '../auth/supabase-auth.client';
import { SupabaseAuthGuard } from '../security/supabase-auth.guard';
import { RlsContextService } from '../security/rls-context.service';
import { RlsInterceptor } from '../security/rls.interceptor';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { RateLimitGuard } from '../rate-limiter/rate-limit.guard';
import { AuditService } from '../audit/audit.service';
import { AuthApplicationService } from '../../application/services/auth-application.service';
import { AuthController } from '../../interface/controllers/auth.controller';
import {
  USER_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  AUDIT_LOG_REPOSITORY,
  SUPABASE_AUTH_CLIENT,
  AUDIT_SERVICE,
  RATE_LIMITER_SERVICE,
} from '../../domain/constants/injection-tokens';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    DatabaseModule,
    TypeOrmModule.forFeature([
      UserOrmEntity,
      DeviceSessionOrmEntity,
      AuditLogOrmEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    SupabaseAuthGuard,
    AuthApplicationService,
    RlsContextService,
    RlsInterceptor,
    RateLimiterService,
    RateLimitGuard,
    AuditService,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    {
      provide: DEVICE_SESSION_REPOSITORY,
      useClass: TypeOrmDeviceSessionRepository,
    },
    { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogTypeOrmRepository },
    { provide: AUDIT_SERVICE, useClass: AuditService },
    { provide: SUPABASE_AUTH_CLIENT, useClass: SupabaseAuthClient },
    { provide: RATE_LIMITER_SERVICE, useClass: RateLimiterService },
  ],
  exports: [
    SupabaseAuthGuard,
    AuthApplicationService,
    RlsContextService,
    RlsInterceptor,
    RateLimitGuard,
    RateLimiterService,
    USER_REPOSITORY,
    DEVICE_SESSION_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    AUDIT_SERVICE,
    SUPABASE_AUTH_CLIENT,
  ],
})
export class AuthModule {}
