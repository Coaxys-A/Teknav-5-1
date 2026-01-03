import { z } from 'zod';

/**
 * Security Validators (Zod)
 *
 * Schemas for security forms.
 * - Device Trust
 * - RBAC Rules
 * - Ban/Unban
 * - Rate Limit Clear
 */

export const DeviceTrustSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  userId: z.number().positive('User ID is required'),
});

export const RbacRuleSchema = z.object({
  tenantId: z.number().positive('Tenant ID is required'),
  rule: z.object({
    id: z.string().min(1, 'Rule ID is required'),
    effect: z.enum(['allow', 'deny']),
    priority: z.number().int().min(0, 'Priority must be positive'),
    actor: z.object({
      roles: z.array(z.string()).optional(),
      userIds: z.array(z.number()).optional(),
    }),
    action: z.enum(['create', 'read', 'update', 'delete', 'publish', 'restore', 'ban', 'assignRole', 'rotateKey', 'runWorkflow', 'executePlugin', 'viewLogs', 'exportData']),
    subject: z.enum(['Tenant', 'Workspace', 'User', 'Article', 'Plugin', 'Workflow', 'FeatureFlag', 'Experiment', 'StoreProduct', 'StoreOrder', 'StoreSubscription', 'StoreEntitlement', 'Webhook', 'Analytics', 'Logs', 'AiTask', 'AiRun', 'AiMessage', 'AiMemory', 'Settings']),
    resource: z.object({
      sensitivity: z.array(z.string()).optional(),
      tenantIds: z.array(z.number()).optional(),
      workspaceIds: z.array(z.number()).optional(),
    }),
    conditions: z.object({
      time: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
      }).optional(),
      ip: z.array(z.string()).optional(),
    }).optional(),
  }),
});

export const BanUserSchema = z.object({
  userId: z.number().positive('User ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  durationMs: z.number().optional(),
});

export const BanIpSchema = z.object({
  ip: z.string().ip('Invalid IP address'),
  reason: z.string().min(1, 'Reason is required'),
  durationMs: z.number().optional(),
});

export const UnbanSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  type: z.enum(['user', 'ip']),
});

export const ClearRateLimitSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  type: z.enum(['user', 'ip', 'token']),
});
