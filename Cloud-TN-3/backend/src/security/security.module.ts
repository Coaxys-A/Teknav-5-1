import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { PolicyService, PolicyGuard, PolicyInterceptor, PolicyModule } from './policy/policy.module';
import { CsrfService, CsrfMiddleware, CsrfModule } from './csrf/csrf.module';
import { RequestMetadataMiddleware } from './request-metadata.middleware';
import { SessionService } from '../auth/session.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../logging/audit-log.module';
import { OwnerSecurityService } from '../owner/security/owner-security.service';
import { OwnerLogsService } from '../owner/logs/owner-logs.service';

/**
 * Security Module
 *
 * Provides:
 * - Policy Engine (RBAC + ABAC)
 * - CSRF Protection (double-submit cookie)
 * - Request Metadata (User-Agent, Device Fingerprinting, Geo)
 * - Owner Security Services
 * - Owner Logs Services
 */

@Global()
@Module({
  imports: [
    PolicyModule.forRoot(),
    CsrfModule.forRoot({ excludeRoutes: [] }),
    SessionModule,
    RedisModule,
    PrismaModule,
    AuditLogModule,
  ],
  providers: [
    RequestMetadataMiddleware,
    OwnerSecurityService,
    OwnerLogsService,
  ],
  exports: [
    PolicyService,
    PolicyGuard,
    PolicyInterceptor,
    CsrfService,
    CsrfMiddleware,
    RequestMetadataMiddleware,
    OwnerSecurityService,
    OwnerLogsService,
  ],
})
export class SecurityModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CsrfMiddleware to all routes
    consumer.apply(CsrfMiddleware).forRoutes('*');

    // Apply RequestMetadataMiddleware to all routes
    consumer.apply(RequestMetadataMiddleware).forRoutes('*');
  }
}
