import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RBAC Policy Service
 * 
 * Enforces permissions per model + action + scope (tenant/workspace)
 */

export type Subject = {
  userId?: number;
  role: string;
  tenantId?: number;
  workspaceId?: number;
  workspaceRole?: string;
};

export type PolicyRequest = {
  subject: Subject;
  action: string;
  resource: string;
  resourceId?: number;
  scope?: 'global' | `tenant:${number}` | `workspace:${number}` | 'self';
};

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if policy is allowed
   */
  async can(policy: PolicyRequest): Promise<boolean> {
    const { subject, action, resource, scope } = policy;

    // Global owner bypass
    if (subject.role === 'OWNER') {
      return true;
    }

    // Check tenant boundary
    if (scope?.startsWith('tenant:') && policy.resourceId) {
      const scopeTenantId = parseInt(scope.split(':')[1]);
      // Resource must belong to tenant (in production, check DB)
      // For now, assume boundary is satisfied
    }

    // Check workspace boundary
    if (scope?.startsWith('workspace:') && policy.resourceId) {
      const scopeWorkspaceId = parseInt(scope.split(':')[1]);
      if (subject.workspaceId && subject.workspaceId !== scopeWorkspaceId) {
        // User not in workspace
        return false;
      }

      // Check workspace role permissions
      if (!this.hasWorkspacePermission(subject.workspaceRole, action, resource)) {
        return false;
      }
    }

    // Check global role permissions
    if (!this.hasGlobalPermission(subject.role, action, resource)) {
      return false;
    }

    // Check self scope (user can only edit own records)
    if (scope === 'self') {
      if (subject.userId !== policy.resourceId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assert policy - throws ForbiddenException if denied
   */
  async assert(policy: PolicyRequest, message?: string): Promise<void> {
    const allowed = await this.can(policy);
    if (!allowed) {
      throw new ForbiddenException(
        message || `Access denied: ${policy.action} on ${policy.resource}`
      );
    }
  }

  /**
   * Check global role permissions
   */
  private hasGlobalPermission(role: string, action: string, resource: string): boolean {
    const adminResources = ['Tenant', 'Workspace', 'User', 'Article', 'Plugin', 'AiTask', 'Order', 'WorkflowDefinition'];
    const managerResources = ['Article', 'WorkflowInstance', 'Plugin'];
    const editorResources = ['Article'];
    const authorResources = ['Article'];
    const userResources = ['Article'];

    const manageActions = ['create', 'update', 'delete', 'manage', 'publish', 'approve', 'assign', 'run', 'install', 'refund'];
    const readActions = ['read'];

    if (role === 'OWNER') return true;
    if (role === 'ADMIN') {
      if (manageActions.includes(action) && adminResources.includes(resource)) return true;
      if (readActions.includes(action)) return true;
    }
    if (role === 'MANAGER') {
      if (manageActions.includes(action) && managerResources.includes(resource)) return true;
      if (readActions.includes(action)) return true;
    }
    if (role === 'EDITOR') {
      if (['create', 'update', 'publish'].includes(action) && editorResources.includes(resource)) return true;
      if (readActions.includes(action)) return true;
    }
    if (role === 'AUTHOR' || role === 'WRITER' || role === 'CREATOR') {
      if (['create', 'update'].includes(action) && authorResources.includes(resource)) return true;
      if (readActions.includes(action)) return true;
    }
    if (role === 'USER' || role === 'GUEST') {
      if (readActions.includes(action) && userResources.includes(resource)) return true;
    }

    return false;
  }

  /**
   * Check workspace role permissions
   */
  private hasWorkspacePermission(workspaceRole: string, action: string, resource: string): boolean {
    if (!workspaceRole) return false;

    const ownerActions = ['create', 'update', 'delete', 'manage', 'publish', 'approve', 'assign'];
    const adminActions = ['create', 'update', 'delete', 'publish', 'approve'];
    const editorActions = ['create', 'update', 'publish'];
    const authorActions = ['create', 'update'];

    const allResources = ['Article', 'WorkflowInstance', 'Plugin', 'User'];

    if (workspaceRole === 'OWNER') {
      if (ownerActions.includes(action) && allResources.includes(resource)) return true;
    }
    if (workspaceRole === 'ADMIN') {
      if (adminActions.includes(action) && allResources.includes(resource)) return true;
    }
    if (workspaceRole === 'EDITOR') {
      if (editorActions.includes(action) && ['Article', 'Plugin'].includes(resource)) return true;
    }
    if (workspaceRole === 'AUTHOR') {
      if (authorActions.includes(action) && ['Article'].includes(resource)) return true;
    }

    return false;
  }
}
