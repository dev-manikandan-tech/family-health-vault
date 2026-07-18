import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthError } from '../../domain/errors/auth.error';

interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  [key: string]: unknown;
}

function buildProblemJson(
  status: number,
  detail: string,
  request: Request,
  extra: Record<string, unknown> = {},
): ProblemJson {
  return {
    type: `https://familyhealthvault.com/errors/${status}`,
    title: HttpStatus[status] ?? 'Error',
    status,
    detail,
    instance: request.url,
    ...extra,
  };
}

@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    switch (exception.code) {
      case 'INVALID_UPLOAD':
        status = HttpStatus.BAD_REQUEST;
        break;
      case 'INVALID_CREDENTIALS':
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
      case 'TOKEN_REVOKED':
      case 'INVALID_OTP':
      case 'OTP_EXPIRED':
        status = HttpStatus.UNAUTHORIZED;
        break;
      case 'USER_NOT_FOUND':
      case 'FAMILY_NOT_FOUND':
      case 'MEMBER_NOT_FOUND':
      case 'INVITATION_NOT_FOUND':
      case 'PROFILE_NOT_FOUND':
      case 'GRANT_NOT_FOUND':
        status = HttpStatus.NOT_FOUND;
        break;
      case 'USER_ALREADY_EXISTS':
      case 'ALREADY_MEMBER':
      case 'PENDING_INVITATION_EXISTS':
      case 'DOCUMENT_NOT_READY':
        status = HttpStatus.CONFLICT;
        break;
      case 'RATE_LIMITED':
        status = HttpStatus.TOO_MANY_REQUESTS;
        break;
      case 'UNAUTHORIZED':
      case 'INVALID_ROLE':
      case 'INVALID_INVITATION':
      case 'CANNOT_MODIFY_OWNER':
      case 'CANNOT_REMOVE_SELF':
      case 'CANNOT_REMOVE_OWNER':
        status = HttpStatus.FORBIDDEN;
        break;
    }

    const body = buildProblemJson(status, exception.message, request, {
      errorCode: exception.code,
      timestamp: new Date().toISOString(),
    });

    response.status(status).contentType('application/problem+json').json(body);
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

    const detail =
      typeof res === 'string'
        ? res
        : ((res as { message?: string | string[] }).message ??
          'An error occurred');

    const body = buildProblemJson(
      status,
      Array.isArray(detail) ? detail.join(', ') : detail,
      request,
      {
        ...(typeof res === 'object' && res !== null ? res : {}),
        timestamp: new Date().toISOString(),
      },
    );

    response.status(status).contentType('application/problem+json').json(body);
  }
}
