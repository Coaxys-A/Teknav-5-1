import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody = isHttp ? exception.getResponse() : null;

    const code = typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody
      ? (responseBody as any).message
      : isHttp
      ? exception.message
      : 'INTERNAL_ERROR';

    const payload = {
      ok: false,
      status,
      path: request.url,
      code,
      type: status >= 500 ? 'system' : 'user',
      timestamp: new Date().toISOString(),
    };

    if (!isHttp) {
      this.logger.error('Unhandled exception', exception as any);
    }

    response.status(status).json(payload);
  }
}
