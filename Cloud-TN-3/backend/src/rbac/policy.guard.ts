import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PERMISSION_KEY, PermissionDescriptor } from './permission.decorator';
import { POLICY_RULES } from './policies.map';

@Injectable()
export class PolicyGuard extends PermissionGuard implements CanActivate {
  constructor(reflector: Reflector, rbac: any) {
    super(reflector, rbac);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<PermissionDescriptor | undefined>(PERMISSION_KEY, context.getHandler());
    if (permission) {
      return super.canActivate(context);
    }
    const req = context.switchToHttp().getRequest<any>();
    const method = req?.method;
    const path = req?.route?.path ?? req?.url ?? '';
    const rule = POLICY_RULES.find((r) => r.method === method && r.path.test(path));
    if (!rule) return true;
    const allowed = await super['rbac'].checkPermission({
      user: req?.user,
      resource: rule.resource,
      action: rule.action,
      scope: rule.scope,
      tenantId: req?.tenantId ?? null,
      workspaceId: req?.workspaceId ?? null,
      path,
      method,
    });
    if (!allowed) throw new ForbiddenException('RBAC_POLICY_DENIED');
    return true;
  }
}
