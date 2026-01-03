import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SecurityLogService } from '../security/logging/security-log.service';

/**
 * Global Exception Filter
 *
 * Catches all exceptions and logs them to AuditLog.
 * Sanitizes stack traces.
 * Includes RequestID/TraceID in log.
 */

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly securityLog: SecurityLogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const requestId = request.headers['x-request-id'] as string;
    const sessionId = request.sessionId;
    const ip = request.ip || request.socket.remoteAddress;
    const ua = request.headers['user-agent'] || 'unknown';

    // 1. Extract Status Code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    // 2. Sanitize Stack Trace
    let stack = 'No stack trace available';
    if (exception instanceof Error && exception.stack) {
      // In production, we might want to remove file paths
      // Or just keep first few lines.
      stack = exception.stack
        .split('\n')
        .slice(0, 10) // First 10 lines
        .join('\n');
    }

    // 3. Log to AuditLog (action="error.exception")
    // Only log internal server errors or policy violations in audit log (to avoid noise)
    // For 4xx errors, usually just log to application logger.
    if (status >= 500) {
      await this.securityLog.logAction({
        actorUserId: 0, // System error
        action: 'error.exception',
        resource: 'System',
        payload: {
          message,
          status,
          stack,
          requestId,
          ip,
          ua,
        },
      });
    }

    // 4. Log to Application Logger
    this.logger.error(
      `[${requestId}] ${message} (${status})`,
      exception instanceof Error ? exception.stack : exception,
    );

    // 5. Send Response
    response.status(status).json({
      message,
      statusCode: status,
      requestId,
      timestamp: new Date(),
    });
  }
}
