import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthContextService } from '../auth/auth-context.service';
import { PolicyEngine } from './policy/policy.engine';
import { CsrfService } from './csrf/csrf.service';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { AbuseDetectionService } from './rate-limit/abuse-detection.service';

/**
 * Unified Security Guard
 * 
 * Enforces:
 * 1. Authentication
 * 2. RBAC Policy (via PolicyEngine)
 * 3. CSRF Protection (via CsrfService)
 * 4. Rate Limiting (via RateLimitService)
 * 5. Abuse Detection (via AbuseDetectionService)
 */

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  constructor(
    private readonly authContext: AuthContextService,
    private readonly policyEngine: PolicyEngine,
    private readonly csrfService: CsrfService,
    private readonly rateLimit: RateLimitService,
    private readonly abuseDetection: AbuseDetectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const reflector = context.getClass();

    // 1. Check Authentication
    const authContext = await this.authContext.getContext(request);
    if (!authContext.userId) {
      this.logger.warn(`Unauthenticated request to ${request.path}`);
      throw new ForbiddenException('Authentication required');
    }

    // 2. Extract policy metadata from decorator
    const policyMetadata = Reflect.getMetadata('policy', handler);
    let requiresPolicy = false;
    let requiresCsrf = false;
    let requiresRateLimit = false;

    if (policyMetadata) {
      requiresPolicy = true;
    }

    // Check if route requires CSRF (mutations)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const isOwnerRoute = request.path?.startsWith('/api/owner/');
    requiresCsrf = isMutation && isOwnerRoute;

    // Check if route requires rate limiting (all routes)
    requiresRateLimit = true;

    // 3. Check CSRF
    if (requiresCsrf) {
      if (this.csrfService.shouldSkipCSRF(request)) {
        this.logger.debug(`CSRF skipped for ${request.path}`);
      } else {
        const userId = authContext.userId!;
        const csrfToken = request.headers?.['x-csrf-token'] || request.headers?.['X-Csrf-Token'];
        if (!csrfToken) {
          this.logger.warn(`CSRF token missing for ${request.path}`);
          throw new ForbiddenException('CSRF token required');
        }
        const isValid = await this.csrfService.validateToken(userId, csrfToken);
        if (!isValid) {
          this.logger.warn(`Invalid CSRF token for ${request.path}`);
          throw new ForbiddenException('Invalid CSRF token');
        }
      }
    }

    // 4. Check Rate Limit (Per-IP)
    if (requiresRateLimit) {
      const isOwnerRoute = request.path?.startsWith('/api/owner/');
      const config = isOwnerRoute ? RateLimitService.OWNER_PER_IP : RateLimitService.QUEUE_PER_IP;
      const ip = authContext.ip;
      
      const rateResult = await this.rateLimit.checkLimit(config, ip);
      if (!rateResult.allowed) {
        this.logger.warn(`Rate limit exceeded for IP ${ip}`);
        throw new ForbiddenException('Rate limit exceeded');
      }
    }

    // 5. Check Rate Limit (Per-User)
    if (requiresRateLimit && authContext.userId) {
      const isOwnerRoute = request.path?.startsWith('/api/owner/');
      const isAiRoute = request.path?.startsWith('/api/ai/');
      
      let userConfig;
      if (isOwnerRoute) {
        userConfig = RateLimitService.OWNER_PER_USER;
      } else if (isAiRoute) {
        userConfig = RateLimitService.AI_PER_USER;
      } else {
        userConfig = RateLimitService.OWNER_PER_USER; // Default
      }
      
      const rateResult = await this.rateLimit.checkLimit(userConfig, authContext.userId.toString());
      if (!rateResult.allowed) {
        this.logger.warn(`Rate limit exceeded for user ${authContext.userId}`);
        throw new ForbiddenException('Rate limit exceeded');
      }
    }

    // 6. Check API Token Abuse Detection
    const apiKey = request.headers?.['x-api-key'];
    if (apiKey) {
      const tokenHash = this.abuseDetection.hashApiKey(apiKey);
      const banInfo = await this.abuseDetection.getTokenBanInfo(tokenHash);
      
      if (banInfo.banned) {
        this.logger.warn(`API token ${tokenHash} is banned (TTL: ${banInfo.ttl}s)`);
        throw new ForbiddenException(
          'API token has been temporarily banned due to suspicious activity',
          { statusCode: HttpStatus.FORBIDDEN }
        );
      }

      // Track usage
      const abuseResult = await this.abuseDetection.trackTokenUsage({
        tokenHash,
        userId: authContext.userId,
        ip: authContext.ip,
        resource: request.path,
      });

      if (!abuseResult.allowed) {
        this.logger.warn(`API token abuse detected: ${tokenHash}`);
        throw new ForbiddenException('API token usage limit exceeded');
      }
    }

    // 7. Check RBAC Policy
    if (requiresPolicy && policyMetadata) {
      const { resource, action } = policyMetadata;
      const policyRequest = {
        userId: authContext.userId,
        role: authContext.role,
        workspaceId: authContext.workspaceId,
        workspaceRole: authContext.workspaceRole,
        tenantId: authContext.tenantId,
        resource,
        action,
        ip: authContext.ip,
        ua: authContext.ua,
      };

      const allowed = await this.policyEngine.check(policyRequest);
      if (!allowed) {
        this.logger.warn(`Policy denied: ${action} on ${resource} by user ${authContext.userId} (${authContext.role})`);
        throw new ForbiddenException(`Access denied: ${action} on ${resource}`);
      }
    }

    // 8. Attach auth context to request for use in controllers
    request.auth = authContext;

    return true;
  }
}
