import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacAuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: any = context.switchToHttp().getRequest();
    const userId = req?.user?.id ?? null;
    const tenantId = req?.tenantId ?? null;
    const workspaceId = req?.workspaceId ?? null;
    const action = `${req?.method ?? 'UNKNOWN'} ${req?.route?.path ?? req?.url ?? ''}`;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(async (result) => {
        if (!userId) return;
        try {
          await (this.prisma as any).auditLog?.create?.({
            data: {
              userId,
              tenantId,
              workspaceId,
              action,
              status: 'ok',
              meta: { result: result ?? null },
              createdAt: new Date(),
            },
          });
        } catch (e) {
          // ignore audit failures
        } finally {
          req.res?.setHeader?.('X-RBAC-Audit', `${Date.now() - startedAt}ms`);
        }
      }),
    );
  }
}
