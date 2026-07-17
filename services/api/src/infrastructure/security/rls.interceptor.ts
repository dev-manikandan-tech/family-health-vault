import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { RlsContextService } from './rls-context.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(
    private readonly rlsContext: RlsContextService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string } | undefined;

    if (!user?.userId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.rlsContext
        .run(user.userId, [], async () => lastValueFrom(next.handle()))
        .then((result) => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch((error) => subscriber.error(error));
    });
  }
}
