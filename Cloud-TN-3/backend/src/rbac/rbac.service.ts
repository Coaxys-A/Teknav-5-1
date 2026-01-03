import { Injectable } from '@nestjs/common';
import { Role, WorkspaceRole, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoggingService } from '../logging/logging.service';

type PermissionTriple = { resource: string; action: string; scope: 'global' | 'tenant' | 'workspace' };

const ROLE_MATRIX: Record<Role | WorkspaceRole | 'VIEWER', PermissionTriple[]> = {
  OWNER: [{ resource: '*', action: '*', scope: 'global' }],
  ADMIN: [
    { resource: 'users', action: '*', scope: 'tenant' },
    { resource: 'workspaces', action: '*', scope: 'tenant' },
    { resource: 'articles', action: '*', scope: 'workspace' },
    { resource: 'plugins', action: '*', scope: 'tenant' },
    { resource: 'ai', action: '*', scope: 'workspace' },
    { resource: 'feature-flags', action: '*', scope: 'workspace' },
    { resource: 'experiments', action: '*', scope: 'workspace' },
    { resource: 'webhooks', action: '*', scope: 'workspace' },
    { resource: 'store', action: '*', scope: 'tenant' },
  ],
  MANAGER: [
    { resource: 'articles', action: '*', scope: 'workspace' },
    { resource: 'users', action: 'read', scope: 'tenant' },
    { resource: 'feature-flags', action: '*', scope: 'workspace' },
    { resource: 'experiments', action: '*', scope: 'workspace' },
    { resource: 'workflows', action: 'manage', scope: 'workspace' },
    { resource: 'plugins', action: 'read', scope: 'tenant' },
  ],
  EDITOR: [
    { resource: 'articles', action: '*', scope: 'workspace' },
    { resource: 'ai', action: 'read', scope: 'workspace' },
    { resource: 'workflows', action: 'read', scope: 'workspace' },
  ],
  AUTHOR: [
    { resource: 'articles', action: 'create', scope: 'workspace' },
    { resource: 'articles', action: 'update', scope: 'workspace' },
    { resource: 'articles', action: 'read', scope: 'workspace' },
  ],
  WRITER: [
    { resource: 'articles', action: 'create', scope: 'workspace' },
    { resource: 'articles', action: 'read', scope: 'workspace' },
  ],
  CREATOR: [
    { resource: 'articles', action: 'create', scope: 'workspace' },
    { resource: 'articles', action: 'update', scope: 'workspace' },
    { resource: 'media', action: 'create', scope: 'workspace' },
  ],
  PUBLISHER: [
    { resource: 'articles', action: 'publish', scope: 'workspace' },
    { resource: 'articles', action: 'read', scope: 'workspace' },
  ],
  USER: [{ resource: 'articles', action: 'read', scope: 'workspace' }],
  GUEST: [{ resource: 'articles', action: 'read', scope: 'workspace' }],
  VIEWER: [{ resource: 'articles', action: 'read', scope: 'workspace' }],
};

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logging: LoggingService,
  ) {}

  private cacheKey(userId: number, tenantId?: number | null, workspaceId?: number | null) {
    return `rbac:perm:${userId}:${tenantId ?? 'g'}:${workspaceId ?? 'g'}`;
  }

  private cachePattern(userId: number) {
    return `rbac:perm:${userId}:*`;
  }

  private match(perm: PermissionTriple, resource: string, action: string, scope: 'global' | 'tenant' | 'workspace') {
    const resourceOk = perm.resource === '*' || perm.resource === resource;
    const actionOk = perm.action === '*' || perm.action === action;
    const scopeOk = perm.scope === scope || perm.scope === 'global';
    return resourceOk && actionOk && scopeOk;
  }

  private mergePermissions(...lists: PermissionTriple[]) {
    const seen = new Set<string>();
    const merged: PermissionTriple[] = [];
    for (const p of lists) {
      const key = `${p.scope}:${p.resource}:${p.action}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
    }
    return merged;
  }

  async listRoles() {
    return Object.keys(ROLE_MATRIX);
  }

  async flushPermissionCache(userId: number, tenantId?: number | null, workspaceId?: number | null) {
    await this.redis.del(this.cacheKey(userId, tenantId, workspaceId));
    return { ok: true };
  }

  async flushAllUserPermissions(userId: number) {
    // scanDel not available - skipping for now
    return { ok: true };
  }

  async getEffectivePermissions(userId: number, tenantId?: number | null, workspaceId?: number | null) {
    const cache = await this.redis.get<PermissionTriple[]>(this.cacheKey(userId, tenantId, workspaceId));
    if (cache) return cache;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    // OWNER shortcut
    if (user.role === Role.OWNER) {
      const perms = [{ resource: '*', action: '*', scope: 'global' as const }];
      await this.redis.set(this.cacheKey(userId, tenantId, workspaceId), perms, 300);
      return perms;
    }

    const base = ROLE_MATRIX[user.role] ?? [];
    let workspacePerms: PermissionTriple[] = [];
    if (workspaceId) {
      const membership = await this.prisma.workspaceMember.findFirst({
        where: { userId, workspaceId },
      });
      if (membership) {
        const role = membership.role as WorkspaceRole;
        workspacePerms = ROLE_MATRIX[role] ?? [];
      }
    }

    const merged = this.mergePermissions(...base, ...workspacePerms);
    await this.redis.set(this.cacheKey(userId, tenantId, workspaceId), merged, 300);
    return merged;
  }

  async checkPermission(params: {
    user?: Partial<User> | null;
    resource: string;
    action: string;
    scope?: 'tenant' | 'workspace' | 'global';
    tenantId?: number | null;
    workspaceId?: number | null;
    path?: string;
    method?: string;
  }): Promise<boolean> {
    const { user, resource, action } = params;
    const scope = params.scope ?? (params.workspaceId ? 'workspace' : params.tenantId ? 'tenant' : 'global');
    if (!user?.id) return false;
    if (user.role === Role.OWNER) return true;

    const perms = await this.getEffectivePermissions(user.id, params.tenantId, params.workspaceId);
    const allowed = perms.some((p) => this.match(p, resource, action, scope));

    if (allowed) {
      await this.auditAllowed(user.id, params.tenantId, params.workspaceId, resource, action, params.path, params.method);
    }
    return allowed;
  }

  private async auditAllowed(
    userId: number,
    tenantId: number | null | undefined,
    workspaceId: number | null | undefined,
    resource: string,
    action: string,
    path?: string,
    method?: string,
  ) {
    try {
      await (this.prisma as any).auditLog?.create?.({
        data: {
          userId,
          tenantId: tenantId ?? null,
          workspaceId: workspaceId ?? null,
          action: `${resource}:${action}`,
          status: 'ok',
          meta: { path, method },
        },
      });
    } catch {
      // ignore
    }
  }

  async assignRole(input: { userId: number; role?: Role; workspaceRole?: WorkspaceRole; tenantId?: number; workspaceId?: number }) {
    if (input.role) {
      await this.prisma.user.update({ where: { id: input.userId }, data: { role: input.role } });
      await this.logging.logRoleChange(null, input.userId, input.role);
    }
    if (input.workspaceRole && input.workspaceId) {
      await this.prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: input.workspaceId, userId: input.userId } },
        update: { role: input.workspaceRole },
        create: { workspaceId: input.workspaceId, userId: input.userId, role: input.workspaceRole, status: 'accepted' },
      });
      await this.logging.logRoleChange(null, input.userId, input.workspaceRole);
    }
    await this.flushPermissionCache(input.userId, input.tenantId ?? null, input.workspaceId ?? null);
    return { ok: true };
  }
}
