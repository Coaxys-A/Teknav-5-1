import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Action, Resource, PolicyContext, POLICY_KEY } from './policy.decorator';
import { PolicyService } from './policy.service';
import { AuthContextService } from '../../auth/auth-context.service';

/**
 * PoliciesGuard
 * 
 * Evaluates policy check before route execution.
 */

@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
    private readonly authContext: AuthContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get policy metadata
    const policy = this.reflector.getAllAndOverride<POLICY_KEY>(
      POLICY_KEY,
      context.getHandler(),
      context.getClass(),
    );

    if (!policy) {
      return true; // No policy required
    }

    const request = context.switchToHttp().getRequest();
    
    // Get AuthContext (userId, role, sessionId, deviceId, ip)
    const authCtx = await this.authContext.getContext(request);
    const policyContext: PolicyContext = {
      userId: authCtx.userId || 0,
      role: authCtx.role || 'GUEST',
      tenantId: authCtx.tenantId,
      workspaceId: authCtx.workspaceId,
      ip: request.ip || '127.0.0.1',
      deviceId: authCtx.deviceId || 'unknown',
      sessionId: authCtx.sessionId || 'unknown',
    };

    // Extract resource ID from request params if possible
    const resourceId = request.params?.id ? parseInt(request.params.id) : undefined;

    // Check policy
    await this.policyService.assert(policyContext, policy.action, policy.resource, resourceId);

    this.logger.debug(`Policy check passed: ${policy.role} -> ${policy.action} on ${policy.resource}`);
    return true;
  }
}
