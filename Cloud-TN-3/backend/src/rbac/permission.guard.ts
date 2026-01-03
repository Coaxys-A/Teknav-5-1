import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, PermissionDescriptor } from './permission.decorator';
import { RbacService } from './rbac.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(protected readonly reflector: Reflector, private readonly rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<PermissionDescriptor | undefined>(PERMISSION_KEY, context.getHandler());
    if (!permission) return true;
    const request = context.switchToHttp().getRequest<any>();
    const user = request?.user;
    const tenantId = request?.tenantId ?? null;
    const workspaceId = request?.workspaceId ?? null;
    const allowed = await this.rbac.checkPermission({
      user,
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      tenantId,
      workspaceId,
      path: request?.route?.path ?? request?.url,
      method: request?.method,
    });
    if (!allowed) throw new ForbiddenException('RBAC_DENIED');
    return true;
  }
}
