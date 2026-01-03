import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

/**
 * Audit Log Module
 *
 * Provides AuditLogService.
 */

@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
