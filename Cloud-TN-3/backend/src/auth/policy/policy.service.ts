import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { AuthContextService } from '../auth-context.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';
import { z } from 'zod';

/**
 * RBAC Policy Engine (Advanced)
 */

export enum Action {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  PUBLISH = 'publish',
  APPROVE = 'approve',
  MANAGE = 'manage',
}

export enum Resource {
  TENANT = 'tenant',
  WORKSPACE = 'workspace',
  USER = 'user',
  ARTICLE = 'article',
  PLUGIN = 'plugin',
  WORKFLOW = 'workflow',
  FEATURE_FLAG = 'feature_flag',
  EXPERIMENT = 'experiment',
  STORE = 'store',
  BILLING = 'billing',
  WEBHOOK = 'webhook',
  ANALYTICS = 'analytics',
  LOGS = 'logs',
  AI = 'ai',
  QUEUE = 'queue',
  DLQ = 'dlq',
}

export interface PolicyContext {
  userId: number;
  role: string;
  tenantId?: number;
  workspaceId?: number;
  ip: string;
  deviceId: string;
  sessionId: string;
}

interface PolicyRule {
  resource: Resource;
  actions: Action[];
  roles: string[];
  scope?: 'global' | 'tenant' | 'workspace' | 'self';
}

/**
 * Hierarchical Rules
 */
const RULES: PolicyRule[] = [
  // OWNER: Global Access
  { resource: Resource.TENANT, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.WORKSPACE, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.USER, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.ARTICLE, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.PLUGIN, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.WORKFLOW, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.FEATURE_FLAG, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.EXPERIMENT, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.STORE, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.BILLING, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.WEBHOOK, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.ANALYTICS, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.LOGS, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.AI, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.QUEUE, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },
  { resource: Resource.DLQ, actions: Object.values(Action), roles: ['OWNER'], scope: 'global' },

  // ADMIN: Tenant-wide
  { resource: Resource.WORKSPACE, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE, Action.MANAGE], roles: ['ADMIN'], scope: 'tenant' },
  { resource: Resource.USER, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE, Action.MANAGE], roles: ['ADMIN'], scope: 'tenant' },
  { resource: Resource.ARTICLE, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE, Action.PUBLISH], roles: ['ADMIN'], scope: 'tenant' },
  { resource: Resource.ANALYTICS, actions: [Action.READ, Action.MANAGE], roles: ['ADMIN'], scope: 'tenant' },
  { resource: Resource.LOGS, actions: [Action.READ], roles: ['ADMIN'], scope: 'tenant' },

  // MANAGER: Workspace-level
  { resource: Resource.ARTICLE, actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.PUBLISH], roles: ['MANAGER'], scope: 'workspace' },
  { resource: Resource.WORKFLOW, actions: [Action.READ, Action.EXECUTE, Action.UPDATE], roles: ['MANAGER'], scope: 'workspace' },
  { resource: Resource.ANALYTICS, actions: [Action.READ], roles: ['MANAGER'], scope: 'workspace' },

  // EDITOR/AUTHOR: Article Content (Self/Org)
  { resource: Resource.ARTICLE, actions: [Action.READ, Action.CREATE, Action.UPDATE], roles: ['EDITOR', 'AUTHOR', 'WRITER', 'CREATOR'], scope: 'workspace' },
  
  // GUEST: Read-only public
  { resource: Resource.ARTICLE, actions: [Action.READ], roles: ['GUEST', 'USER'], scope: 'global' },
];

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    private readonly authContext: AuthContextService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  /**
   * Check if policy is allowed
   */
  can(context: PolicyContext, action: Action, resource: Resource, resourceId?: number): boolean {
    // Find applicable rules
    const applicableRules = RULES.filter(
      rule => rule.resource === resource && rule.actions.includes(action) && rule.roles.includes(context.role)
    );

    if (applicableRules.length === 0) {
      return false;
    }

    // Check scope
    for (const rule of applicableRules) {
      if (this.checkScope(context, rule.scope, resourceId, rule.resource)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if policy is allowed and throw if not
   */
  async assert(context: PolicyContext, action: Action, resource: Resource, resourceId?: number) {
    const isAllowed = this.can(context, action, resource, resourceId);

    if (!isAllowed) {
      this.logger.warn(`Access denied: ${context.role} cannot ${action} on ${resource}`);

      await this.dataAccessLog.logAccess({
        actorUserId: context.userId,
        action: 'access_denied',
        targetType: resource,
        targetId: resourceId || 0,
        metadata: {
          attemptedAction: action,
          context,
        },
      });

      throw new ForbiddenException('You do not have permission to perform this action.');
    }
  }

  /**
   * Check scope rule (Advanced)
   */
  private checkScope(context: PolicyContext, scope?: string, resourceId?: number, resource?: Resource): boolean {
    if (!scope) return true;

    if (scope === 'global') {
      return context.role === 'OWNER';
    }

    if (scope === 'tenant') {
      return context.role === 'OWNER' || context.role === 'ADMIN';
    }

    if (scope === 'workspace') {
      return context.role === 'OWNER' || context.role === 'ADMIN' || context.role === 'MANAGER';
    }

    if (scope === 'self') {
      if (resourceId) {
        return resourceId === context.userId;
      }
      return false;
    }

    return true;
  }
}
