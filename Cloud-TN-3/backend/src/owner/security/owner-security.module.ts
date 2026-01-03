import { Module } from '@nestjs/common';
import { OwnerSecurityController } from './owner-security.controller';
import { OwnerSecurityService } from './owner-security.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AuditLogModule } from '../../logging/audit-log.module';
import { PolicyModule } from '../../security/policy/policy.module';
import { SessionModule } from '../../security/session/session.module';
import { DeviceModule } from '../../security/device/device.module';
import { AbuseModule } from '../../security/abuse/abuse.module';
import { SecurityLoggingModule } from '../../security/logging/security-logging.module';

/**
 * Owner Security Module
 *
 * Provides:
 * - Owner Security Service
 * - Owner Security Controller
 */

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuditLogModule,
    PolicyModule,
    SessionModule,
    DeviceModule,
    AbuseModule,
    SecurityLoggingModule,
  ],
  providers: [
    OwnerSecurityService,
    OwnerSecurityController,
  ],
  exports: [
    OwnerSecurityService,
    OwnerSecurityController,
  ],
})
export class OwnerSecurityModule {}
