import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthError } from '../../domain/errors/auth.error';

@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    switch (exception.code) {
      case 'INVALID_CREDENTIALS':
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
      case 'TOKEN_REVOKED':
      case 'INVALID_OTP':
      case 'OTP_EXPIRED':
        status = HttpStatus.UNAUTHORIZED;
        break;
      case 'USER_NOT_FOUND':
        status = HttpStatus.NOT_FOUND;
        break;
      case 'USER_ALREADY_EXISTS':
        status = HttpStatus.CONFLICT;
        break;
      case 'RATE_LIMITED':
        status = HttpStatus.TOO_MANY_REQUESTS;
        break;
    }

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

@Catch(HttpException)
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const res = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      ...(typeof res === 'string' ? { message: res } : res),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
