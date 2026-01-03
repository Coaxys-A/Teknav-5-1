import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { CsrfService } from './csrf.service';

/**
 * CSRF Guard - Validates CSRF token for state-changing requests
 * 
 * Usage: Apply to all POST/PUT/PATCH/DELETE endpoints (except webhooks and API token routes)
 * 
 * This guard works with CsrfMiddleware:
 * - CsrfMiddleware sets cookie on GET requests
 * - This guard validates the header token on mutations
 */

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(private readonly csrfService: CsrfService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;

    // Skip CSRF for GET requests
    if (method === 'GET') {
      return true;
    }

    // Skip CSRF for API tokens and webhooks (handled by CsrfService)
    if (this.csrfService.shouldSkipCSRF(request)) {
      return true;
    }

    const userId = request.user?.id;
    const csrfToken = request.headers?.['x-csrf-token'] || request.headers?.['X-Csrf-Token'];

    if (!userId) {
      this.logger.warn(`CSRF validation failed: no userId`);
      throw new ForbiddenException('Authentication required');
    }

    if (!csrfToken) {
      this.logger.warn(`CSRF validation failed: no token`);
      throw new ForbiddenException('CSRF token required');
    }

    // Validate CSRF token
    const isValid = await this.csrfService.validateToken(userId, csrfToken);
    if (!isValid) {
      this.logger.warn(`CSRF validation failed: invalid token for user ${userId}`);
      throw new ForbiddenException('Invalid CSRF token', { statusCode: HttpStatus.FORBIDDEN });
    }

    this.logger.debug(`CSRF validation passed for user ${userId}`);
    return true;
  }
}
