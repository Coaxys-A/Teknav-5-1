import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyDocument, PolicyRule, PolicyAction, PolicySubject, PolicyEffect } from './policy.types';

/**
 * Policy Rules Service
 *
 * Manages loading of Policy Rules.
 * Sources:
 * 1. Static Default Rules (Defined in code)
 * 2. Dynamic Overrides (Stored in Redis or Tenant.configuration/FeatureFlag.configuration JSON)
 *
 * No schema changes used.
 */

@Injectable()
export class PolicyRulesService {
  private readonly logger = new Logger(PolicyRulesService.name);
  private readonly REDIS_PREFIX = process.env.REDIS_KEY_PREFIX || 'q';
  private readonly CACHE_TTL = 300; // 5 mins
  private readonly OVERRIDES_PREFIX = 'policy:overrides';

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get Policy Document
   * Combines static rules with dynamic overrides.
   */
  async getPolicyDocument(tenantId?: number): Promise<PolicyDocument> {
    // 1. Get static default rules
    const staticRules = this.getStaticRules();

    // 2. Get dynamic overrides (from Redis or DB)
    const overrides = await this.getOverrides(tenantId);

    // 3. Merge overrides (Override rules with matching ID, or append if new)
    // Simple merge: Overrides replace static rules with same ID
    const mergedRules = [...staticRules];
    const overrideMap = new Map(overrides.map(r => [r.id, r]));

    const finalRules = mergedRules.filter(rule => !overrideMap.has(rule.id));
    finalRules.push(...overrides);

    return {
      version: 1,
      rules: finalRules,
      defaults: {
        denyByDefault: true,
      },
    };
  }

  /**
   * Get Overrides
   * Checks Redis first, then Tenant.configuration JSON.
   */
  private async getOverrides(tenantId?: number): Promise<PolicyRule[]> {
    if (tenantId) {
      // Check Redis first for tenant-specific overrides
      const cacheKey = `${this.REDIS_PREFIX}:${this.OVERRIDES_PREFIX}:${tenantId}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Check Tenant.configuration
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { configuration: true },
      });

      if (tenant && tenant.configuration) {
        const config = tenant.configuration as any;
        if (config.policy && config.policy.rules) {
          // Cache it
          await this.redis.set(cacheKey, JSON.stringify(config.policy.rules), this.CACHE_TTL);
          return config.policy.rules;
        }
      }
    }

    // Check Global Overrides (stored in Redis or FeatureFlag)
    const globalCacheKey = `${this.REDIS_PREFIX}:${this.OVERRIDES_PREFIX}:global`;
    const globalCached = await this.redis.get(globalCacheKey);
    if (globalCached) {
      return JSON.parse(globalCached);
    }

    // Check FeatureFlag
    // Note: Assuming a feature flag 'global.policy.overrides' exists
    // For now, just return empty
    return [];
  }

  /**
   * Get Static Default Rules
   */
  private getStaticRules(): PolicyRule[] {
    return [
      // P1: OWNER Global Access
      {
        id: 'rule:owner:global',
        effect: PolicyEffect.ALLOW,
        priority: 100,
        actor: {
          roles: ['OWNER'],
        },
        action: [PolicyAction.CREATE, PolicyAction.READ, PolicyAction.UPDATE, PolicyAction.DELETE, PolicyAction.EXPORT_DATA, PolicyAction.MANAGE_SETTINGS],
        subject: Object.values(PolicySubject),
        resource: {
          sensitivity: ['restricted'],
        },
      },
      // P2: OWNER Ban/Admin Privilege
      {
        id: 'rule:owner:ban',
        effect: PolicyEffect.ALLOW,
        priority: 100,
        actor: {
          roles: ['OWNER'],
        },
        action: [PolicyAction.BAN, PolicyAction.ASSIGN_ROLE, PolicyAction.ROTATE_KEY, PolicyAction.VIEW_LOGS, PolicyAction.IMPERSONATE],
        subject: [PolicySubject.USER, PolicySubject.SETTINGS, PolicySubject.LOGS],
      },
      // P3: TENANT ADMIN Workspace Management
      {
        id: 'rule:admin:tenant-manage',
        effect: PolicyEffect.ALLOW,
        priority: 90,
        actor: {
          roles: ['ADMIN'],
        },
        action: [PolicyAction.MANAGE_WORKSPACES],
        subject: [PolicySubject.WORKSPACE],
        resource: {
          // Must match actor's tenantIds (handled in engine)
          // Condition: 'tenantId' is checked in engine context
        },
      },
      // P4: TENANT ADMIN User Management
      {
        id: 'rule:admin:tenant-users',
        effect: PolicyEffect.ALLOW,
        priority: 90,
        actor: {
          roles: ['ADMIN'],
        },
        action: [PolicyAction.MANAGE_USERS, PolicyAction.BAN],
        subject: [PolicySubject.USER],
        resource: {
          sensitivity: ['internal', 'confidential'],
        },
      },
      // P5: WORKSPACE MEMBER Access
      {
        id: 'rule:member:workspace-read',
        effect: PolicyEffect.ALLOW,
        priority: 80,
        actor: {
          roles: ['MEMBER', 'EDITOR', 'VIEWER'], // Generic role assumption
        },
        action: [PolicyAction.READ],
        subject: [PolicySubject.ARTICLE, PolicySubject.WORKFLOW, PolicySubject.SETTINGS],
        resource: {
          // Must match actor's workspaceMemberships (handled in engine)
        },
      },
      // P6: EDITOR Article Create
      {
        id: 'rule:editor:article-create',
        effect: PolicyEffect.ALLOW,
        priority: 70,
        actor: {
          roles: ['EDITOR'],
        },
        action: [PolicyAction.CREATE, PolicyAction.UPDATE],
        subject: [PolicySubject.ARTICLE],
        resource: {
          sensitivity: ['public', 'internal'],
        },
      },
      // P7: DENY ACCESS TO RESTRICTED RESOURCES BY DEFAULT
      {
        id: 'rule:deny:restricted',
        effect: PolicyEffect.DENY,
        priority: 10,
        actor: {},
        action: [PolicyAction.READ, PolicyAction.UPDATE],
        subject: Object.values(PolicySubject),
        resource: {
          sensitivity: ['restricted'],
        },
      },
      // P8: DENY DELETE TENANT FOR NON-OWNER
      {
        id: 'rule:deny:delete-tenant',
        effect: PolicyEffect.DENY,
        priority: 100,
        actor: {
          roles: ['ADMIN', 'MEMBER', 'VIEWER'], // Everyone except OWNER
        },
        action: [PolicyAction.DELETE],
        subject: [PolicySubject.TENANT],
        resource: {},
      },
    ];
  }

  /**
   * Save Override (Admin Only)
   * Persists rule override to Redis (and optionally to Tenant.config)
   */
  async saveOverride(tenantId: number, rule: PolicyRule, actorUserId: number): Promise<void> {
    // Save to Redis
    const cacheKey = `${this.REDIS_PREFIX}:${this.OVERRIDES_PREFIX}:${tenantId}`;
    const currentOverrides = await this.redis.get(cacheKey);
    let overrides: PolicyRule[] = currentOverrides ? JSON.parse(currentOverrides) : [];

    // Replace existing rule with same ID, or add new
    const index = overrides.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      overrides[index] = rule;
    } else {
      overrides.push(rule);
    }

    await this.redis.set(cacheKey, JSON.stringify(overrides), this.CACHE_TTL);

    // Optional: Persist to Tenant.config (JSON field)
    // await this.prisma.tenant.update({
    //   where: { id: tenantId },
    //   data: {
    //     configuration: {
    //       policy: { rules: overrides },
    //     },
    //   },
    // });
  }

  /**
   * Delete Override
   */
  async deleteOverride(tenantId: number, ruleId: string, actorUserId: number): Promise<void> {
    const cacheKey = `${this.REDIS_PREFIX}:${this.OVERRIDES_PREFIX}:${tenantId}`;
    const currentOverrides = await this.redis.get(cacheKey);
    if (!currentOverrides) return;

    let overrides: PolicyRule[] = JSON.parse(currentOverrides);
    overrides = overrides.filter(r => r.id !== ruleId);

    await this.redis.set(cacheKey, JSON.stringify(overrides), this.CACHE_TTL);
  }
}
