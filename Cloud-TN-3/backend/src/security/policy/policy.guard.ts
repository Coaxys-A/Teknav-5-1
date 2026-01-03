import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyEngineService } from './policy.engine.service';
import { PolicyAction, PolicySubject, PolicyResult } from './policy.types';

/**
 * Policy Guard
 *
 * Applies RBAC enforcement at the controller level.
 * Reads metadata from `@RequirePermission` decorator.
 */

@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly policyEngine: PolicyEngineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get Metadata
    const requiredAction = this.reflector.get<PolicyAction>('action', context.getHandler());
    const requiredSubject = this.reflector.get<PolicySubject>('subject', context.getHandler());

    // 2. If no metadata, allow (or deny based on default)
    if (!requiredAction || !requiredSubject) {
      this.logger.warn('Policy Guard called without required action/subject metadata');
      return true; // Default to true to avoid breaking existing routes
    }

    // 3. Extract Request Data
    const request = context.switchToHttp().getRequest();
    const actor = request.user; // Assumed populated by AuthMiddleware
    const sessionId = request.sessionId; // Assumed populated
    const deviceId = request.headers['x-device-id'] || sessionId;

    if (!actor) {
      throw new ForbiddenException('User not authenticated');
    }

    // 4. Build Policy Context
    // Extract resource params from request
    const tenantId = request.params?.tenantId || request.body?.tenantId || actor.tenantId;
    const workspaceId = request.params?.workspaceId || request.body?.workspaceId;

    const policyRequest = {
      actor: {
        userId: actor.id,
        roles: actor.roles || ['VIEWER'],
        workspaceMemberships: actor.workspaceMemberships || [],
        tenantIds: actor.tenantIds || [],
        ownerId: actor.ownerId,
      },
      action: requiredAction,
      subject: requiredSubject,
      resource: {
        tenantId,
        workspaceId,
        sensitivity: 'public', // Default, can be overridden by decorator options
      },
      context: {
        ip: request.ip || request.socket.remoteAddress,
        ua: request.headers['user-agent'],
        deviceId: deviceId,
        sessionId: sessionId,
        requestId: request.headers['x-request-id'],
        geo: request.geo, // Populated by RequestMetadataMiddleware
      },
    };

    // 5. Evaluate Policy
    let result: PolicyResult;
    try {
      result = await this.policyEngine.evaluate(policyRequest);
    } catch (error) {
      this.logger.error('Failed to evaluate policy:', error);
      throw new ForbiddenException('Failed to evaluate policy');
    }

    // 6. Enforce Decision
    if (!result.allowed || result.denied) {
      this.logger.warn(`Policy Guard Denied: ${result.reason}`);
      throw new ForbiddenException(result.reason || 'Access Denied');
    }

    // 7. Attach Result to Request (for logging)
    request.policyResult = result;

    return true;
  }
}
