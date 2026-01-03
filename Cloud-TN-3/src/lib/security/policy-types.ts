/**
 * Frontend Policy Types
 *
 * Mirrors backend policy types for UI usage.
 */

/**
 * Policy Roles
 */
export enum PolicyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EDITOR = 'EDITOR',
  AUTHOR = 'AUTHOR',
  VIEWER = 'VIEWER',
}

/**
 * Policy Actions
 */
export enum PolicyAction {
  READ = 'read',
  LIST = 'list',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESTORE = 'restore',
  PUBLISH = 'publish',
  APPROVE = 'approve',
  REVOKE = 'revoke',
  REPLAY = 'replay',
  PURGE = 'purge',
  EXECUTE = 'execute',
  CONFIGURE = 'configure',
  IMPERSONATE = 'impersonate',
}

/**
 * Policy Resources
 */
export enum PolicyResource {
  TENANT = 'tenant',
  WORKSPACE = 'workspace',
  USER = 'user',
  ARTICLE = 'article',
  PLUGIN = 'plugin',
  AI_MODEL_CONFIG = 'ai.modelConfig',
  AI_AGENT = 'ai.agent',
  AI_TASK = 'ai.task',
  WORKFLOW = 'workflow',
  FEATURE_FLAG = 'featureFlag',
  EXPERIMENT = 'experiment',
  STORE_PRODUCT = 'store.product',
  STORE_SUBSCRIPTION = 'store.subscription',
  STORE_ORDER = 'store.order',
  WEBHOOK = 'webhook',
  LOG = 'log',
  QUEUE = 'queue',
  CACHE = 'cache',
  SETTINGS = 'settings',
}

/**
 * Policy Rule
 */
export interface PolicyRule {
  id: string;
  effect: 'allow' | 'deny';
  subject: {
    type: 'role' | 'user';
    id: string;
  };
  action: PolicyAction;
  resource: PolicyResource;
  conditions?: PolicyConditions;
  description?: string;
}

/**
 * Policy Conditions
 */
export interface PolicyConditions {
  tenantId?: string;
  workspaceId?: string;
  userIds?: string[];
  fields?: string[];
  time?: {
    start?: string;
    end?: string;
  };
}

/**
 * Role Permissions
 */
export interface RolePermissions {
  actions: PolicyAction[];
  resource: PolicyResource;
  effect: 'allow' | 'deny';
  scope?: 'all' | 'own' | 'workspace';
}

/**
 * Policy Document
 */
export interface PolicyDocument {
  version: 1;
  roles: Record<PolicyRole, {
    role: PolicyRole;
    permissions: RolePermissions[];
  }>;
  rules: PolicyRule[];
  defaults: {
    denyByDefault: boolean;
  };
}

/**
 * Policy Test Result
 */
export interface PolicyTestResult {
  allowed: boolean;
  denied: boolean;
  reason?: string;
  matchedRuleId?: string;
}
