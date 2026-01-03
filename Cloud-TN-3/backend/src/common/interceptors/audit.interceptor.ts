import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(() => {
        const user = req.user;
        const action = `${req.method} ${req.route?.path ?? req.url}`;
        this.audit
          .log(action, user?.id, { body: req.body, query: req.query }, req.path, req.ip, req.headers['user-agent'])
          .catch(() => {});
      }),
    );
  }
}
