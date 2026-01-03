import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Resource, Action, PolicyRequest } from './policy.types';

/**
 * RBAC Policy Engine
 * 
 * Rules:
 * 1. Role.OWNER can do anything across all tenants/workspaces
 * 2. Role.ADMIN can manage within tenant/workspace scope only (default: deny cross-tenant)
 * 3. Workspace roles apply to workspace-scoped resources
 * 4. Tenant boundary: resource.tenantId must match request.tenantId
 * 5. Optional attribute rules: user can only edit own profile unless admin
 */

@Injectable()
export class PolicyEngine {
  private readonly logger = new Logger(PolicyEngine.name);

  /**
   * Check if a policy request is allowed
   */
  async check(request: PolicyRequest): Promise<boolean> {
    // Super-admin/owner bypass
    if (this.isOwnerOrSuperAdmin(request.role)) {
      return true;
    }

    // Tenant boundary check
    if (this.requiresTenantBoundary(request.resource) && !this.satisfiesTenantBoundary(request)) {
      this.logger.warn(`Tenant boundary violated: role=${request.role}, resource=${request.resource}`);
      return false;
    }

    // Attribute-based checks (e.g., user can only edit own profile)
    if (this.requiresAttributeCheck(request.resource, request.action) && !this.satisfiesAttributes(request)) {
      return false;
    }

    return true;
  }

  /**
   * Check and throw 403 if denied
   */
  async checkOrThrow(request: PolicyRequest, errorMessage?: string): Promise<void> {
    const allowed = await this.check(request);
    if (!allowed) {
      throw new ForbiddenException(
        errorMessage || `Access denied: ${request.action} on ${request.resource}`
      );
    }
  }

  /**
   * Check if role is OWNER or SUPER_ADMIN
   */
  private isOwnerOrSuperAdmin(role: string | null): boolean {
    if (!role) return false;
    return ['OWNER', 'SUPER_ADMIN'].includes(role.toUpperCase());
  }

  /**
   * Check if resource requires tenant boundary enforcement
   */
  private requiresTenantBoundary(resource: Resource): boolean {
    // Resources that are tenant-scoped
    const tenantScopedResources: Resource[] = [
      Resource.TENANT,
      Resource.WORKSPACE,
      Resource.USER,
      Resource.ARTICLE,
      Resource.WORKFLOW,
      Resource.PLUGIN,
      Resource.FEATURE_FLAG,
      Resource.EXPERIMENT,
      Resource.STORE,
      Resource.SETTINGS,
    ];
    return tenantScopedResources.includes(resource);
  }

  /**
   * Check if tenant boundary is satisfied
   */
  private satisfiesTenantBoundary(request: PolicyRequest): boolean {
    // If request doesn't have a tenantId, allow (system-level request)
    if (!request.tenantId) {
      return true;
    }

    // If resource has explicit tenantId, it must match request's tenantId
    if (request.resourceAttributes?.tenantId) {
      return request.resourceAttributes.tenantId === request.tenantId;
    }

    // ADMIN role is restricted to their tenant scope by default
    // (Cross-tenant operations require explicit allow)
    if (request.role === 'ADMIN' && request.resourceAttributes?.tenantId !== request.tenantId) {
      return false;
    }

    // WORKSPACE scope: can access resources within their workspace's tenant
    const workspaceScopes = ['WORKSPACE_OWNER', 'WORKSPACE_ADMIN', 'WORKSPACE_EDITOR'];
    if (workspaceScopes.includes(request.role || '')) {
      // Workspace members can access resources in their workspace's tenant
      // This would require fetching workspace->tenant mapping
      return true;
    }

    return true;
  }

  /**
   * Check if resource requires attribute-based checks
   */
  private requiresAttributeCheck(resource: Resource, action: Action): boolean {
    // User profile: user can only edit their own profile unless admin
    if (resource === Resource.USER && action === Action.UPDATE) {
      return true;
    }
    return false;
  }

  /**
   * Check if attributes are satisfied
   */
  private satisfiesAttributes(request: PolicyRequest): boolean {
    // User profile update: can only update own profile unless admin
    if (request.resource === Resource.USER && request.action === Action.UPDATE) {
      if (request.role === 'OWNER' || request.role === 'ADMIN') {
        return true;
      }
      if (request.resourceAttributes?.resourceUserId) {
        return request.resourceAttributes.resourceUserId === request.userId;
      }
    }
    return true;
  }
}
