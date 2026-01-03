import { Controller, Get, Post, Put, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditLogService } from '../../logging/audit-log.service';
import { AuthContextService } from '../../auth/auth-context.service';

@Controller('owner/settings/security')
export class OwnerSecuritySettingsController {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly authContext: AuthContextService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSecuritySettings() {
    // In real implementation, fetch from Tenant.configuration or Workspace.entitlements
    return {
      data: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60'),
        ownerPerIpLimit: 120, // 2x regular limit for owners
        ownerPerUserLimit: 120,
        authPerIpLimit: 10, // 10 login attempts per minute
        aiPerUserLimit: 30, // 30 AI requests/min per user
        bruteForceThreshold: 5, // 5 failed attempts before warning
      },
    };
  }

  @Put('rate-limit')
  @HttpCode(HttpStatus.OK)
  async updateRateLimitSettings(
    @Body() body: {
      rateLimitWindowMs?: number;
      rateLimitMax?: number;
      ownerPerIpLimit?: number;
      ownerPerUserLimit?: number;
    },
  ) {
    const request = arguments[2]; // Request object
    const authContext = await this.authContext.getContext(request);

    // Log audit event
    await this.auditLog.logAction({
      actorId: authContext.userId,
      action: 'owner.settings.security.update',
      resource: 'SecuritySettings',
      payload: body,
      ip: authContext.ip,
      ua: authContext.ua,
    });

    // In real implementation, save to Tenant.configuration or Workspace.entitlements
    return {
      data: { updated: true },
    };
  }

  @Post('brute-force/unban')
  @HttpCode(HttpStatus.OK)
  async unbanBruteForceIP(@Body() body: { ip: string }) {
    const request = arguments[2];
    const authContext = await this.authContext.getContext(request);

    // In real implementation, clear IP ban from Redis
    // await this.rateLimitService.resetLimit(RateLimitService.AUTH_PER_IP, body.ip);

    await this.auditLog.logAction({
      actorId: authContext.userId,
      action: 'owner.security.unban_ip',
      resource: 'SecuritySettings',
      payload: { ip: body.ip },
      ip: authContext.ip,
      ua: authContext.ua,
    });

    return {
      data: { unbanned: true, ip: body.ip },
    };
  }

  @Post('api-token/unban')
  @HttpCode(HttpStatus.OK)
  async unbanApiToken(@Body() body: { tokenHash: string }) {
    const request = arguments[2];
    const authContext = await this.authContext.getContext(request);

    // In real implementation, clear token ban from AbuseDetectionService
    // await this.abuseDetectionService.clearTokenBan(body.tokenHash);

    await this.auditLog.logAction({
      actorId: authContext.userId,
      action: 'owner.security.unban_token',
      resource: 'ApiToken',
      payload: { tokenHash: body.tokenHash },
      ip: authContext.ip,
      ua: authContext.ua,
    });

    return {
      data: { unbanned: true, tokenHash: body.tokenHash },
    };
  }
}
