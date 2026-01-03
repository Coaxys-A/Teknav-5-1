import { Resource, Action, Role, WorkspaceRole } from '../../../prisma/schema';

/**
 * RBAC Policy Matrix
 * 
 * Format: Resource -> Action -> Roles[]
 * 
 * Legend:
 * - OWNER: Can do everything across all tenants/workspaces
 * - ADMIN: Can do everything within their tenant/workspace scope (no cross-tenant by default)
 * - MANAGER: Can manage resources within their workspace
 * - EDITOR: Can read/edit resources within their workspace
 * - AUTHOR: Can create/edit their own content
 * - USER: Can read public content
 */

// Global role permissions (simplified)
const GLOBAL_ROLE_PERMISSIONS: Record<Role, Set<Resource>> = {
  OWNER: new Set(Object.values(Resource)),
  ADMIN: new Set([
    Resource.TENANT,
    Resource.WORKSPACE,
    Resource.USER,
    Resource.ARTICLE,
    Resource.WORKFLOW,
    Resource.PLUGIN,
    Resource.FEATURE_FLAG,
    Resource.EXPERIMENT,
    Resource.ANALYTICS,
    Resource.STORE,
    Resource.SETTINGS,
  ]),
  MANAGER: new Set([
    Resource.WORKSPACE,
    Resource.USER,
    Resource.ARTICLE,
    Resource.WORKFLOW,
    Resource.ANALYTICS,
  ]),
  EDITOR: new Set([
    Resource.USER,
    Resource.ARTICLE,
  ]),
  AUTHOR: new Set([
    Resource.USER,
    Resource.ARTICLE,
  ]),
  USER: new Set([
    Resource.USER,
    Resource.ARTICLE,
  ]),
};

// Workspace role permissions (workspace-scoped)
const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, Set<Resource>> = {
  OWNER: new Set([
    Resource.WORKSPACE,
    Resource.USER,
    Resource.ARTICLE,
    Resource.WORKFLOW,
    Resource.ANALYTICS,
    Resource.SETTINGS,
  ]),
  ADMIN: new Set([
    Resource.WORKSPACE,
    Resource.USER,
    Resource.ARTICLE,
    Resource.WORKFLOW,
    Resource.ANALYTICS,
  ]),
  EDITOR: new Set([
    Resource.USER,
    Resource.ARTICLE,
  ]),
  AUTHOR: new Set([
    Resource.USER,
    Resource.ARTICLE,
  ]),
  VIEWER: new Set([
    Resource.USER,
    Resource.ARTICLE,
  ]),
};

/**
 * Check if a role has permission for a resource
 */
export function hasRolePermission(
  role: Role | WorkspaceRole | string,
  resource: Resource
): boolean {
  const normalizedRole = role.toUpperCase();

  // Check global roles
  for (const [globalRole, resources] of Object.entries(GLOBAL_ROLE_PERMISSIONS)) {
    if (normalizedRole === globalRole && resources.has(resource)) {
      return true;
    }
  }

  // Check workspace roles
  for (const [workspaceRole, resources] of Object.entries(WORKSPACE_ROLE_PERMISSIONS)) {
    if (normalizedRole === workspaceRole && resources.has(resource)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a role can perform a specific action on a resource
 */
export function hasActionPermission(
  role: Role | WorkspaceRole | string,
  resource: Resource,
  action: Action
): boolean {
  // Simplified action-based checks
  if (action === Action.READ) {
    return true; // Most roles can read
  }

  if (action === Action.CREATE) {
    return hasRolePermission(role, resource);
  }

  if (action === Action.UPDATE || action === Action.DELETE) {
    return hasRolePermission(role, resource);
  }

  if (action === Action.MANAGE) {
    return normalizedRole === 'OWNER' || normalizedRole === 'ADMIN';
  }

  return false;
}
