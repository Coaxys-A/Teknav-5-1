import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyService } from './policy.service';
import { POLICY_KEY } from './policy.decorator';
import { Req } from '@nestjs/common';

/**
 * RBAC Policies Guard
 * 
 * Reads @RequirePolicy decorator and enforces policy checks
 */

@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyMetadata = this.reflector.get(POLICY_KEY, context.getHandler());
    const request = context.switchToHttp().getRequest();

    if (!policyMetadata) {
      return true; // No policy decorator, allow
    }

    const { action, resource, scope } = policyMetadata;

    // Build subject from request (user should be attached by AuthGuard)
    const subject = {
      userId: request.user?.id,
      role: request.user?.role,
      tenantId: request.user?.tenantId,
      workspaceId: request.user?.workspaceId,
      workspaceRole: request.user?.workspaceRole,
    };

    // Resolve scope
    let resolvedScope = scope;
    if (scope === 'self' && subject.userId) {
      // Self scope: resource must belong to user
      // For now, we'll use resourceId from URL params or body
      const resourceId = request.params?.id || request.body?.id;
      if (resourceId) {
        resolvedScope = 'self';
      } else {
        // Cannot enforce self without resourceId
        this.logger.warn(`Self scope used but no resourceId found for ${resource}`);
        return false;
      }
    }

    const policyRequest = {
      subject,
      action,
      resource,
      resourceId: request.params?.id,
      scope: resolvedScope,
    };

    // Check policy
    const allowed = await this.policyService.can(policyRequest);
    if (!allowed) {
      this.logger.warn(`Policy denied: ${action} on ${resource} by user ${subject.userId} (${subject.role})`);
      throw new ForbiddenException(
        `Access denied: ${action} on ${resource}`
      );
    }

    return true;
  }
}
