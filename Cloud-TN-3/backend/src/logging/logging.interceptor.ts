import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { LoggingService } from './logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logging: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<any>();
    const user = request?.user;
    const path = request?.originalUrl ?? request?.url;
    const method = request?.method;
    const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';
    const isOwnerApi = path?.includes('/owner');

    if (isAdmin && isOwnerApi) {
      this.logging.logAdminAction(`${method} ${path}`, user?.id, path, method, {
        tenantId: request?.tenantId ?? null,
        workspaceId: request?.workspaceId ?? null,
      });
    }

    if (method === 'GET' && user?.id) {
      this.logging.logDataAccess(`GET ${path}`, user.id, 'http_request', null, {
        query: request?.query,
        tenantId: request?.tenantId ?? null,
        workspaceId: request?.workspaceId ?? null,
      });
    }

    return next.handle().pipe(
      tap(() => {
        /* noop */
      }),
      catchError((err) => {
        this.logging.logError(path ?? 'unknown', err, user?.id);
        return throwError(() => err);
      }),
    );
  }
}
