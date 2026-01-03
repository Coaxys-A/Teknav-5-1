import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const headerTenant = req?.headers?.['x-tenant-id'];
    const userTenant = req?.user?.tenantId ?? null;
    if (!headerTenant || !userTenant) return true;
    if (Number(headerTenant) !== Number(userTenant)) {
      throw new ForbiddenException('CROSS_TENANT_DENIED');
    }
    return true;
  }
}
