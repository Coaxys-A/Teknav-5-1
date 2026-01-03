import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PolicyEngineService } from './policy.engine.service';
import { PolicyAction, PolicySubject, PolicyResult } from './policy.types';

/**
 * Policy Interceptor
 *
 * Can be applied globally or per-controller to enforce policy decisions
 * and log them.
 *
 * Note: This is an *interceptor*. If you use it, you must also have a `@RequirePermission` decorator
 * attached to method to provide metadata (action, subject, resource) for interceptor to read.
 */

@Injectable()
export class PolicyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PolicyInterceptor.name);

  constructor(private readonly policyEngine: PolicyEngineService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // 1. Get Handler Metadata
    const handler = context.getHandler();
    const metadata = Reflect.getMetadata('policy', handler);

    if (!metadata) {
      // No policy requirements defined, proceed
      return next.handle();
    }

    const { action, subject, resource } = metadata;

    // 2. Extract Actor and Context
    const request = context.switchToHttp().getRequest();
    const actor = request.user; // Assumed to be populated by AuthMiddleware
    const contextData = {
      ip: request.ip || request.socket.remoteAddress,
      ua: request.headers['user-agent'],
      deviceId: request.headers['x-device-id'] || request.session?.deviceId,
      sessionId: request.sessionId,
      requestId: request.headers['x-request-id'],
      geo: request.geo, // Populated by RequestMetadataMiddleware
    };

    // 3. Build Policy Request
    const policyRequest = {
      actor: {
        userId: actor.id,
        roles: actor.roles, // ['OWNER', 'ADMIN', ...]
        workspaceMemberships: actor.workspaceMemberships,
        tenantIds: actor.tenantIds,
        ownerId: actor.ownerId,
      },
      action: action as PolicyAction,
      subject: subject as PolicySubject,
      resource: resource,
      context: contextData,
    };

    // 4. Evaluate Policy
    let result: PolicyResult;
    try {
      result = await this.policyEngine.evaluate(policyRequest);
    } catch (error) {
      this.logger.error('Failed to evaluate policy:', error);
      // Throw 403 Forbidden
      throw new ForbiddenException('Failed to evaluate policy');
    }

    // 5. Enforce Decision
    if (!result.allowed || result.denied) {
      this.logger.warn(`Policy Denied: ${result.reason} for request ${contextData.requestId}`);
      throw new ForbiddenException(result.reason || 'Policy Denied');
    }

    // 6. Attach Result to Request (for later logging)
    request.policyResult = result;

    // 7. Proceed
    return next.handle().pipe(
      tap(() => {
        // 8. Log Success (Optional, if not already handled by AuditLog middleware)
        this.logger.debug(`Policy Allowed: ${result.reason} for request ${contextData.requestId}`);
      }),
    );
  }
}
