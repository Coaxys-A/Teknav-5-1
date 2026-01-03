import { Injectable, Logger } from '@nestjs/common';
import { PolicyRulesService } from './policy.rules.service';
import {
  PolicyRequest,
  PolicyResult,
  PolicyRule,
  PolicyAction,
  PolicySubject,
  PolicyEffect,
} from './policy.types';

/**
 * Policy Engine Service
 *
 * Core RBAC/ABAC Evaluation Logic.
 * Rules are loaded from `PolicyRulesService`.
 * Default: Deny.
 */

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);

  constructor(private readonly policyRules: PolicyRulesService) {}

  /**
   * Evaluate Policy
   * Returns PolicyResult (allowed, denied, reason, matchedRuleId, decisionId)
   */
  async evaluate(request: PolicyRequest): Promise<PolicyResult> {
    const { actor, action, subject, resource, context } = request;

    // 1. Load Policy Document
    const policyDoc = await this.policyRules.getPolicyDocument(resource?.tenantId);

    // 2. Sort rules by priority (descending)
    const sortedRules = policyDoc.rules.sort((a, b) => b.priority - a.priority);

    // 3. Iterate rules and find match
    for (const rule of sortedRules) {
      if (this.matchRule(rule, request)) {
        const decisionId = this.generateDecisionId();
        this.logger.debug(`Policy matched: ${rule.id} for actor ${actor.userId} action ${action} subject ${subject}`);

        // If effect is DENY, return immediately
        if (rule.effect === PolicyEffect.DENY) {
          return {
            allowed: false,
            denied: true,
            reason: `Denied by rule: ${rule.id}`,
            matchedRuleId: rule.id,
            policyDecisionId: decisionId,
          };
        }

        // If effect is ALLOW, return immediately (explicit allow overrides default deny)
        return {
          allowed: true,
          denied: false,
          reason: `Allowed by rule: ${rule.id}`,
          matchedRuleId: rule.id,
          policyDecisionId: decisionId,
        };
      }
    }

    // 4. No rules matched -> Apply Default
    if (policyDoc.defaults.denyByDefault) {
      return {
        allowed: false,
        denied: true,
        reason: 'Denied by default (no matching rule)',
        policyDecisionId: this.generateDecisionId(),
      };
    }

    return {
      allowed: true,
      denied: false,
      reason: 'Allowed by default (no matching rule)',
      policyDecisionId: this.generateDecisionId(),
    };
  }

  /**
   * Check if a rule matches request
   */
  private matchRule(rule: PolicyRule, request: PolicyRequest): boolean {
    const { actor, action, subject, resource, context } = request;

    // 1. Match Actor (Roles)
    if (rule.actor.roles && rule.actor.roles.length > 0) {
      if (!actor.roles.some(role => rule.actor.roles.includes(role))) {
        return false;
      }
    }

    // 2. Match Actor (UserIds)
    if (rule.actor.userIds && rule.actor.userIds.length > 0) {
      if (!rule.actor.userIds.includes(actor.userId)) {
        return false;
      }
    }

    // 3. Match Action
    if (!this.matchAction(rule.action, action)) {
      return false;
    }

    // 4. Match Subject
    if (!this.matchSubject(rule.subject, subject)) {
      return false;
    }

    // 5. Match Resource (TenantIds)
    if (rule.resource && rule.resource.tenantIds && rule.resource.tenantIds.length > 0) {
      if (resource && resource.tenantId && !rule.resource.tenantIds.includes(resource.tenantId)) {
        return false;
      }
    }

    // 6. Match Resource (WorkspaceIds)
    if (rule.resource && rule.resource.workspaceIds && rule.resource.workspaceIds.length > 0) {
      if (resource && resource.workspaceId && !rule.resource.workspaceIds.includes(resource.workspaceId)) {
        return false;
      }
    }

    // 7. Match Resource (Sensitivity)
    if (rule.resource && rule.resource.sensitivity && rule.resource.sensitivity.length > 0) {
      if (!resource || !resource.sensitivity || !rule.resource.sensitivity.includes(resource.sensitivity)) {
        return false;
      }
    }

    // 8. Match Conditions
    if (rule.conditions) {
      if (!this.matchConditions(rule.conditions, context, actor, resource)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Match Action
   */
  private matchAction(ruleAction: PolicyAction | PolicyAction[], requestAction: PolicyAction): boolean {
    if (Array.isArray(ruleAction)) {
      return ruleAction.includes(requestAction);
    }
    return ruleAction === requestAction;
  }

  /**
   * Match Subject
   */
  private matchSubject(ruleSubject: PolicySubject | PolicySubject[], requestSubject: PolicySubject): boolean {
    if (Array.isArray(ruleSubject)) {
      return ruleSubject.includes(requestSubject);
    }
    return ruleSubject === requestSubject;
  }

  /**
   * Match Conditions
   */
  private matchConditions(
    conditions: any,
    context: any,
    actor: any,
    resource: any,
  ): boolean {
    // 1. Time Range
    if (conditions.time) {
      const now = new Date();
      const start = new Date(conditions.time.start);
      const end = new Date(conditions.time.end);
      if (now < start || now > end) {
        return false;
      }
    }

    // 2. IP Whitelist
    if (conditions.ip && conditions.ip.length > 0) {
      if (!conditions.ip.includes(context.ip)) {
        return false;
      }
    }

    // 3. Workspace Membership (Dynamic)
    // Check if actor has membership in workspace specified in resource
    // (This is complex, so we'll skip for now or implement a simpler check)
    if (conditions.workspaceMembershipRequired) {
      if (!resource || !resource.workspaceId) {
        return false;
      }
      const hasMembership = actor.workspaceMemberships.some(m => m.workspaceId === resource.workspaceId);
      if (!hasMembership) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `policy:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }
}
