import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLog: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only audit owner APIs
    if (!request.path?.startsWith('/api/owner/')) {
      return next.handle();
    }

    const method = request.method;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isMutation) {
      return next.handle();
    }

    // Get actorId from request (assume it's attached by auth guard)
    const actorId = request.user?.id || null;

    // Extract relevant parts for logging
    const pathParts = request.path.split('/').filter(Boolean);
    const action = `owner.${pathParts.slice(2, 4).join('.')}.${method.toLowerCase()}`;
    const resource = pathParts[3] || 'unknown';

    // Sanitize request body (remove secrets)
    const sanitizedPayload = this.sanitizeBody(request.body);

    // Get IP and UA
    const ip = request.ip || request.connection?.remoteAddress || '127.0.0.1';
    const ua = request.headers?.['user-agent'] || 'unknown';

    // Subscribe to response to log on success
    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data: any) => {
        const status = response.statusCode;
        if (status >= 200 && status < 300) {
          this.auditLog.logAction({
            actorId,
            action,
            resource,
            payload: sanitizedPayload,
            ip,
            ua,
          }).catch(err => {
            this.logger.error('Failed to log audit:', err);
          });
        }
        return data;
      },
    );
  }

  private sanitizeBody(body: any): Record<string, any> | null {
    if (!body) return null;

    const copy = { ...body };

    // Sanitize common secret fields
    const secretFields = ['password', 'token', 'secret', 'apiKey', 'apiToken', 'privateKey', 'accessToken', 'refreshToken', 'authToken'];
    secretFields.forEach(field => {
      if (copy[field]) {
        copy[field] = '***';
      }
    });

    // Handle nested objects
    for (const key in copy) {
      if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = this.sanitizeBody(copy[key]);
      }
    }

    return copy;
  }
}
