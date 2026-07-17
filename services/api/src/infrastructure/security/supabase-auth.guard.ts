import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthApplicationService } from '../../application/services/auth-application.service';
import { ISupabaseAuthClient } from '../../domain/services/supabase-auth-client.interface';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SUPABASE_AUTH_CLIENT } from '../../domain/constants/injection-tokens';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SUPABASE_AUTH_CLIENT)
    private readonly supabaseClient: ISupabaseAuthClient,
    private readonly authService: AuthApplicationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload;
    try {
      payload = await this.supabaseClient.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.authService.syncUser(payload, {
      deviceId: request.headers['x-device-id'] as string,
      deviceName: request.headers['x-device-name'] as string,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
    (request as any).user = { userId: user.id, email: user.email };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return undefined;
    }
    return auth.slice(7);
  }
}
