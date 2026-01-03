import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';
import { AuthContextService } from '../../auth/auth-context.service';

/**
 * Admin Audit Interceptor
 * 
 * Logs all privileged actions (mutations) for OWNER/ADMIN roles.
 */

export const ADMIN_AUDIT_KEY = 'admin_audit';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminAuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
    private readonly authContext: AuthContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if admin audit is enabled (default true for /owner and /admin controllers)
    const isAuditEnabled = this.reflector.get<boolean | undefined>(
      ADMIN_AUDIT_KEY,
      context.getClass(),
    ) ?? true;

    if (!isAuditEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const actorId = request.user?.id;

    // Log request start
    this.logger.debug(`Admin action started: ${request.method} ${request.path}`);

    return next.handle().pipe(
      tap(async (response) => {
        // Log success
        this.logger.debug(`Admin action success: ${request.method} ${request.path}`);

        await this.auditLog.logAction({
          actorId,
          action: `admin.${request.method.toLowerCase()}.${request.path.replace('/api/', '')}`,
          resource: this.extractResource(request.path),
          payload: this.sanitizePayload(request.body),
          ip: request.ip,
          ua: request.ua,
        });

        // Log data access
        await this.dataAccessLog.logAccess({
          actorUserId: actorId,
          action: 'admin_mutation',
          targetType: this.extractResource(request.path),
          targetId: request.params?.id ? parseInt(request.params.id) : 0,
          metadata: {
            method: request.method,
            path: request.path,
            status: 200,
          },
        });
      }),
      catchError(async (error: any) => {
        // Log failure
        this.logger.error(`Admin action failed: ${request.method} ${request.path}`, error);

        await this.auditLog.logAction({
          actorId,
          action: `admin.${request.method.toLowerCase()}.${request.path.replace('/api/', '')}`,
          resource: this.extractResource(request.path),
          payload: this.sanitizePayload(request.body),
          ip: request.ip,
          ua: request.ua,
          status: 'FAILED',
          errorMessage: error.message,
        });

        await this.dataAccessLog.logAccess({
          actorUserId: actorId,
          action: 'admin_mutation_denied',
          targetType: this.extractResource(request.path),
          targetId: request.params?.id ? parseInt(request.params.id) : 0,
          metadata: {
            method: request.method,
            path: request.path,
            error: error.message,
          },
        });

        throw error;
      }),
    );
  }

  /**
   * Extract resource name from path
   */
  private extractResource(path: string): string {
    const parts = path.split('/');
    if (parts.length > 3) {
      return parts[3]; // e.g., /api/owner/tenants -> tenants
    }
    return path;
  }

  /**
   * Sanitize payload (remove sensitive fields)
   */
  private sanitizePayload(payload: any): any {
    if (!payload) return {};

    const sanitized: any = {};
    const sensitiveKeys = ['password', 'secret', 'token', 'apiKey', 'api_key'];

    for (const [key, value] of Object.entries(payload)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
