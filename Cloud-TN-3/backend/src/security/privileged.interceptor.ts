import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class PrivilegedAuditInterceptor implements NestInterceptor {
  constructor(private readonly logging: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: any = context.switchToHttp().getRequest();
    const path = req?.route?.path ?? req?.url ?? '';
    const method = req?.method ?? 'GET';
    const actorId = req?.user?.id ?? null;
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ?? req?.ip;
    const geo = req?.headers?.['x-geo-country'] ?? req?.headers?.['x-vercel-ip-country'];

    return next.handle().pipe(
      tap(async () => {
        if (method === 'POST' && path.startsWith('/rbac/assignments')) {
          await this.logging.logRoleChange(actorId, req?.body?.userId, req?.body?.role ?? req?.body?.workspaceRole);
        }
        if (method === 'POST' && path.startsWith('/owner/publish')) {
          await this.logging.logPublish(actorId, req?.body?.articleId ?? null, req?.body?.workspaceId ?? null);
        }
        if (path.startsWith('/owner/workflows')) {
          await this.logging.logWorkflowOp(actorId, Number(req?.body?.workflowId ?? req?.params?.id ?? 0), `${method}:${path}`);
        }
        if (path.includes('/plugins') && method === 'POST') {
          await this.logging.logPlugin(Number(req?.body?.pluginId ?? 0), 'install', path);
        }
        if (path.includes('/ai/agents') && method === 'POST') {
          await this.logging.logAiUsage(actorId, Number(req?.params?.id ?? 0), null);
        }
        if (path.includes('/auth/login') && method === 'POST') {
          await this.logging.logLogin(actorId, ip, geo as string, req?.session?.id);
        }
      }),
    );
  }
}
