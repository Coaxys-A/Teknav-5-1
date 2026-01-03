import { Module } from '@nestjs/common';
import { SecurityLogService } from './security-log.service';
import { AuditLogModule } from '../../logging/audit-log.module';

/**
 * Security Logging Module
 *
 * Provides SecurityLogService.
 */

@Module({
  imports: [AuditLogModule],
  providers: [SecurityLogService],
  exports: [SecurityLogService],
})
export class SecurityLoggingModule {}
