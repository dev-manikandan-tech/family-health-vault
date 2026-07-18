import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthModule } from './infrastructure/modules/auth.module';
import { FamilyModule } from './infrastructure/modules/family.module';
import { HealthModule } from './infrastructure/health/health.module';
import { VisitModule } from './infrastructure/modules/visit.module';
import { DocumentModule } from './infrastructure/modules/document.module';
import { RequestIdMiddleware } from './infrastructure/middleware/request-id.middleware';
import { RlsInterceptor } from './infrastructure/security/rls.interceptor';
import { RateLimitGuard } from './infrastructure/rate-limiter/rate-limit.guard';
import {
  AuthExceptionFilter,
  GlobalHttpExceptionFilter,
} from './interface/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FamilyModule,
    VisitModule,
    DocumentModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: RlsInterceptor },
    { provide: APP_FILTER, useClass: AuthExceptionFilter },
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
