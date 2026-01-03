/**
 * Policy Types
 *
 * Defines the structure for Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC).
 */

/**
 * Supported Actions
 */
export enum PolicyAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  RESTORE = 'restore',
  BAN = 'ban',
  ASSIGN_ROLE = 'assignRole',
  ROTATE_KEY = 'rotateKey',
  RUN_WORKFLOW = 'runWorkflow',
  EXECUTE_PLUGIN = 'executePlugin',
  VIEW_LOGS = 'viewLogs',
  EXPORT_DATA = 'exportData',
  MANAGE_USERS = 'manageUsers',
  MANAGE_WORKSPACES = 'manageWorkspaces',
  MANAGE_SETTINGS = 'manageSettings',
  IMPERSONATE = 'impersonate',
}

/**
 * Supported Subjects (Models)
 */
export enum PolicySubject {
  TENANT = 'Tenant',
  WORKSPACE = 'Workspace',
  USER = 'User',
  ARTICLE = 'Article',
  PLUGIN = 'Plugin',
  WORKFLOW = 'Workflow',
  FEATURE_FLAG = 'FeatureFlag',
  EXPERIMENT = 'Experiment',
  STORE_PRODUCT = 'StoreProduct',
  STORE_ORDER = 'StoreOrder',
  STORE_SUBSCRIPTION = 'StoreSubscription',
  STORE_ENTITLEMENT = 'StoreEntitlement',
  WEBHOOK = 'Webhook',
  ANALYTICS = 'Analytics',
  LOGS = 'Logs',
  AI_TASK = 'AiTask',
  AI_RUN = 'AiRun',
  AI_MESSAGE = 'AiMessage',
  AI_MEMORY = 'AiMemory',
  SETTINGS = 'Settings',
}

/**
 * Effects
 */
export enum PolicyEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

/**
 * Context
 */
export interface PolicyContext {
  ip: string;
  ua: string;
  deviceId: string;
  sessionId: string;
  requestId: string;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Actor
 */
export interface PolicyActor {
  userId: number;
  roles: string[];
  workspaceMemberships: { workspaceId: number; role: string }[];
  tenantIds: number[];
  ownerId?: number;
}

/**
 * Resource
 */
export interface PolicyResource {
  tenantId?: number;
  workspaceId?: number;
  ownerId?: number;
  sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
}

/**
 * Policy Rule
 */
export interface PolicyRule {
  id: string;
  effect: PolicyEffect;
  actor: {
    roles?: string[];
    userIds?: number[];
  };
  action: PolicyAction | PolicyAction[];
  subject: PolicySubject | PolicySubject[];
  resource?: {
    sensitivity?: string[];
    tenantIds?: number[];
    workspaceIds?: number[];
  };
  conditions?: {
    time?: {
      start: string;
      end: string;
    };
    ip?: string[];
    workspaceMembershipRequired?: boolean;
  };
  priority: number;
}

/**
 * Policy Document
 */
export interface PolicyDocument {
  version: 1;
  rules: PolicyRule[];
  defaults: {
    denyByDefault: boolean;
  };
}

/**
 * Policy Request
 */
export interface PolicyRequest {
  actor: PolicyActor;
  action: PolicyAction;
  subject: PolicySubject;
  resource?: PolicyResource;
  context: PolicyContext;
}

/**
 * Policy Result
 */
export interface PolicyResult {
  allowed: boolean;
  denied: boolean;
  reason?: string;
  matchedRuleId?: string;
  policyDecisionId: string;
}
