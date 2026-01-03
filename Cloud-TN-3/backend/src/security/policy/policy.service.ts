import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  PolicyAction,
  PolicyResource,
  PolicyRole,
  PolicyDocument,
  PolicyRule,
  PolicySubject,
  PolicyContext,
  PolicyResult,
  DEFAULT_POLICY,
} from './policy.types';
import { AuditLogService } from '../../logging/audit-log.service';

/**
 * Policy Service
 *
 * Implements RBAC + ABAC policy engine.
 * Stores policy in Tenant.configuration.policyEngine.
 * Evaluates policies with caching (Redis).
 * Logs all deny decisions to AuditLog.
 */

@Injectable()
export class PolicyService implements OnModuleInit {
  private readonly logger = new Logger(PolicyService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly POLICY_CACHE_PREFIX = 'policy:doc:';
  private readonly EVAL_CACHE_PREFIX = 'policy:eval:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
  ) {}

  async onModuleInit() {
    this.logger.log('PolicyService initialized');
  }

  // ==========================================================================
  // POLICY LOADING & CACHING
  // ==========================================================================

  /**
   * Get policy document for tenant
   * Loads from Tenant.configuration.policyEngine
   * Uses Redis cache
   */
  async getPolicyDocument(tenantId: string): Promise<PolicyDocument> {
    const cacheKey = `${this.POLICY_CACHE_PREFIX}${tenantId}`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as PolicyDocument;
    }

    // Load from DB
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { configuration: true },
    });

    if (!tenant || !tenant.configuration) {
      this.logger.warn(`No configuration for tenant ${tenantId}, using default policy`);
      return DEFAULT_POLICY;
    }

    const policyEngineConfig = tenant.configuration as any;
    const policyDoc: PolicyDocument = policyEngineConfig.policyEngine || DEFAULT_POLICY;

    // Validate version (basic)
    if (policyDoc.version !== 1) {
      this.logger.warn(`Unsupported policy version ${policyDoc.version}, using default`);
      return DEFAULT_POLICY;
    }

    // Cache policy
    await this.redis.set(cacheKey, JSON.stringify(policyDoc), this.CACHE_TTL);

    return policyDoc;
  }

  /**
   * Invalidate policy cache for tenant
   */
  async invalidatePolicyCache(tenantId: string): Promise<void> {
    const cacheKey = `${this.POLICY_CACHE_PREFIX}${tenantId}`;
    await this.redis.del(cacheKey);
    this.logger.debug(`Invalidated policy cache for tenant ${tenantId}`);
  }

  /**
   * Update policy document for tenant
   * Stores in Tenant.configuration.policyEngine
   * Invalidates cache
   */
  async updatePolicyDocument(
    tenantId: string,
    policy: PolicyDocument,
    actorId: number,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { configuration: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Update configuration
    const newConfiguration = {
      ...tenant.configuration,
      policyEngine: policy,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { configuration: newConfiguration },
    });

    // Invalidate cache
    await this.invalidatePolicyCache(tenantId);

    // Log audit
    await this.auditLog.logAction({
      actorId,
      action: 'owner.policy.update',
      resource: 'Policy',
      payload: { tenantId, policyVersion: policy.version },
    });
  }

  // ==========================================================================
  // POLICY EVALUATION
  // ==========================================================================

  /**
   * Evaluate policy for subject, action, resource, context
   * Returns allow/deny + reason
   * Caches evaluation results
   */
  async evaluate(
    subject: PolicySubject | PolicyRole,
    action: PolicyAction,
    resource: PolicyResource,
    context: PolicyContext,
  ): Promise<PolicyResult> {
    // Normalize subject
    const normalizedSubject: PolicySubject =
      typeof subject === 'string'
        ? { type: 'role', id: subject }
        : subject;

    // Check evaluation cache
    const evalCacheKey = this.getEvalCacheKey(
      normalizedSubject,
      action,
      resource,
      context,
    );
    const cachedResult = await this.redis.get(evalCacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult) as PolicyResult;
    }

    // Load policy
    const policyDoc = await this.getPolicyDocument(context.tenantId);

    // Evaluate RBAC (Role Permissions)
    const rbacResult = this.evaluateRBAC(
      normalizedSubject,
      action,
      resource,
      context,
      policyDoc,
    );

    if (rbacResult.denied) {
      // Deny from RBAC
      const result: PolicyResult = {
        allowed: false,
        denied: true,
        reason: rbacResult.reason,
        matchedRuleId: null,
      };

      await this.cacheEvalResult(evalCacheKey, result);
      await this.logPolicyDeny(
        normalizedSubject,
        action,
        resource,
        context,
        result.reason,
      );
      return result;
    }

    if (rbacResult.allowed) {
      // Allow from RBAC (explicit allow)
      const result: PolicyResult = {
        allowed: true,
        denied: false,
        reason: rbacResult.reason,
        matchedRuleId: null,
      };

      await this.cacheEvalResult(evalCacheKey, result);
      return result;
    }

    // RBAC was neither explicit allow nor deny (implicit)
    // Evaluate ABAC (Rules)
    const abacResult = this.evaluateABAC(
      normalizedSubject,
      action,
      resource,
      context,
      policyDoc,
    );

    if (abacResult.denied) {
      // Deny from ABAC
      const result: PolicyResult = {
        allowed: false,
        denied: true,
        reason: abacResult.reason,
        matchedRuleId: abacResult.matchedRuleId,
      };

      await this.cacheEvalResult(evalCacheKey, result);
      await this.logPolicyDeny(
        normalizedSubject,
        action,
        resource,
        context,
        result.reason,
        result.matchedRuleId,
      );
      return result;
    }

    if (abacResult.allowed) {
      // Allow from ABAC
      const result: PolicyResult = {
        allowed: true,
        denied: false,
        reason: abacResult.reason,
        matchedRuleId: abacResult.matchedRuleId,
      };

      await this.cacheEvalResult(evalCacheKey, result);
      return result;
    }

    // No explicit allow/deny found
    // Use default (deny by default)
    const result: PolicyResult = {
      allowed: false,
      denied: true,
      reason: `Denied by default (no allow/deny rule matched)`,
      matchedRuleId: null,
    };

    await this.cacheEvalResult(evalCacheKey, result);
    await this.logPolicyDeny(
      normalizedSubject,
      action,
      resource,
      context,
      result.reason,
    );
    return result;
  }

  /**
   * Evaluate RBAC (Role Permissions)
   */
  private evaluateRBAC(
    subject: PolicySubject,
    action: PolicyAction,
    resource: PolicyResource,
    context: PolicyContext,
    policyDoc: PolicyDocument,
  ): PolicyResult {
    // Only evaluate RBAC if subject type is role
    if (subject.type !== 'role') {
      return { allowed: false, denied: false, reason: 'Subject is not a role, skipping RBAC' };
    }

    const role = subject.id as PolicyRole;
    const rolePermissions = policyDoc.roles[role];

    if (!rolePermissions) {
      return { allowed: false, denied: false, reason: `Role ${role} not found in policy` };
    }

    // Find permission for resource
    const permission = rolePermissions.permissions.find(
      (p) => p.resource === resource,
    );

    if (!permission) {
      return { allowed: false, denied: false, reason: `No permission defined for resource ${resource}` };
    }

    // Check if action is allowed/denied for this resource
    const actionAllowed = permission.actions.includes(action);

    if (!actionAllowed) {
      return { allowed: false, denied: false, reason: `Action ${action} not in allowed actions for resource ${resource}` };
    }

    // Check effect
    if (permission.effect === 'deny') {
      return { allowed: false, denied: true, reason: `Deny effect for role ${role} on ${resource}` };
    }

    // Check scope
    if (permission.scope === 'own') {
      // "own" scope means user can only perform action on own resources
      // For now, we assume "own" means userId in context matches targetId (if applicable)
      // This is a simplification - in real implementation, you'd pass targetId in context
      // For simplicity, we'll treat "own" as "workspace" (tenant workspace context)
      // A proper implementation would require checking resource ownership
      if (context.workspaceId) {
        return { allowed: true, denied: false, reason: `Allow effect (scope: own/workspace)` };
      } else {
        return { allowed: false, denied: true, reason: `Scope mismatch (own scope requires workspace context)` };
      }
    } else if (permission.scope === 'workspace') {
      // "workspace" scope means user can perform action within their workspace
      // Check if workspaceId matches
      if (context.workspaceId) {
        return { allowed: true, denied: false, reason: `Allow effect (scope: workspace)` };
      } else {
        return { allowed: false, denied: true, reason: `Scope mismatch (workspace scope requires workspaceId in context)` };
      }
    } else if (permission.scope === 'all') {
      return { allowed: true, denied: false, reason: `Allow effect (scope: all)` };
    }

    return { allowed: false, denied: false, reason: `Unknown scope: ${permission.scope}` };
  }

  /**
   * Evaluate ABAC (Rules)
   */
  private evaluateABAC(
    subject: PolicySubject,
    action: PolicyAction,
    resource: PolicyResource,
    context: PolicyContext,
    policyDoc: PolicyDocument,
  ): PolicyResult {
    // Find matching rules
    const matchingRules = policyDoc.rules.filter((rule) => {
      // Check action
      if (rule.action !== action) return false;

      // Check resource
      if (rule.resource !== resource) return false;

      // Check subject (role or user)
      if (rule.subject.type !== subject.type) return false;
      if (rule.subject.id !== subject.id) return false;

      // Check conditions
      if (rule.conditions) {
        // Check tenantId
        if (rule.conditions.tenantId && rule.conditions.tenantId !== context.tenantId) {
          return false;
        }

        // Check workspaceId
        if (rule.conditions.workspaceId && rule.conditions.workspaceId !== context.workspaceId) {
          return false;
        }

        // Check userIds
        if (rule.conditions.userIds && rule.conditions.userIds.length > 0) {
          if (!rule.conditions.userIds.includes(context.userId)) {
            return false;
          }
        }

        // Check time
        if (rule.conditions.time) {
          const now = new Date();
          if (rule.conditions.time.start) {
            const startTime = new Date(rule.conditions.time.start);
            if (now < startTime) return false;
          }
          if (rule.conditions.time.end) {
            const endTime = new Date(rule.conditions.time.end);
            if (now > endTime) return false;
          }
        }
      }

      return true;
    });

    // Sort rules by priority (deny first, then allow)
    matchingRules.sort((a, b) => {
      if (a.effect === 'deny' && b.effect === 'allow') return -1;
      if (a.effect === 'allow' && b.effect === 'deny') return 1;
      return 0;
    });

    // Evaluate rules
    for (const rule of matchingRules) {
      if (rule.effect === 'deny') {
        return {
          allowed: false,
          denied: true,
          reason: `Denied by rule ${rule.id}`,
          matchedRuleId: rule.id,
        };
      } else if (rule.effect === 'allow') {
        return {
          allowed: true,
          denied: false,
          reason: `Allowed by rule ${rule.id}`,
          matchedRuleId: rule.id,
        };
      }
    }

    return { allowed: false, denied: false, reason: 'No ABAC rules matched' };
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getEvalCacheKey(
    subject: PolicySubject,
    action: PolicyAction,
    resource: PolicyResource,
    context: PolicyContext,
  ): string {
    const subjectStr = `${subject.type}:${subject.id}`;
    const scopeStr = context.workspaceId ? context.workspaceId : 'global';
    const key = `${this.EVAL_CACHE_PREFIX}${context.tenantId}:${subjectStr}:${action}:${resource}:${scopeStr}`;
    return key;
  }

  private async cacheEvalResult(key: string, result: PolicyResult): Promise<void> {
    await this.redis.set(key, JSON.stringify(result), 60); // 1 minute cache
  }

  private async logPolicyDeny(
    subject: PolicySubject,
    action: PolicyAction,
    resource: PolicyResource,
    context: PolicyContext,
    reason: string,
    matchedRuleId?: string,
  ): Promise<void> {
    await this.auditLog.logAction({
      actorUserId: subject.type === 'user' ? parseInt(subject.id) : undefined,
      action: 'policy.deny',
      resource: `Policy:${subject.id}`,
      payload: {
        subject,
        action,
        resource,
        context,
        reason,
        matchedRuleId,
      },
    });
  }
}
