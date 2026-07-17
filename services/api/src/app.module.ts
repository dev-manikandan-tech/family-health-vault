import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthModule } from './infrastructure/modules/auth.module';
import { JwtAuthGuard } from './infrastructure/security/jwt-auth.guard';
import { RlsInterceptor } from './infrastructure/security/rls.interceptor';
import { RateLimitGuard } from './infrastructure/rate-limiter/rate-limit.guard';
import {
  AuthExceptionFilter,
  GlobalHttpExceptionFilter,
} from './interface/filters/http-exception.filter';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: RlsInterceptor },
    { provide: APP_FILTER, useClass: AuthExceptionFilter },
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
  ],
})
export class AppModule {}
