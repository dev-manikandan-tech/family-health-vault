import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors: { path: (string | number)[]; message: string }[];
  [key: string]: unknown;
}

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const issues = exception.issues.map((issue) => ({
      path: issue.path.map((part) =>
        typeof part === 'symbol' ? part.toString() : part,
      ),
      message: issue.message,
    }));

    const body: ProblemJson = {
      type: 'https://familyhealthvault.com/errors/400',
      title: 'Bad Request',
      status: HttpStatus.BAD_REQUEST,
      detail: 'Validation failed',
      instance: request.url,
      errors: issues,
      timestamp: new Date().toISOString(),
    };

    response.status(HttpStatus.BAD_REQUEST).json(body);
  }
}
