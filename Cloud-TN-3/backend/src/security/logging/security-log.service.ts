import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService } from '../../logging/audit-log.service';

/**
 * Security Logging Service
 *
 * Specialized logging for Security events.
 * Wraps AuditLogService with pre-defined actions.
 */

@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(private readonly auditLog: AuditLogService) {}

  /**
   * Log Admin Privilege Action
   */
  async logAdminPrivilege(
    actorUserId: number,
    action: string, // e.g. "ban", "rotateKey"
    resource: string,
    payload: any,
    ip: string,
    ua: string,
    geo?: any,
  ): Promise<void> {
    await this.auditLog.logAction({
      actorUserId,
      action: `admin.${action}`,
      resource,
      payload: {
        ...payload,
        elevated: true,
        ip,
        ua,
        geo,
      },
    });
  }

  /**
   * Log Policy Decision
   */
  async logPolicyDecision(
    actorUserId: number,
    action: string,
    resource: string,
    allowed: boolean,
    reason: string,
    policyDecisionId: string,
    ip: string,
    ua: string,
    geo?: any,
  ): Promise<void> {
    await this.auditLog.logAction({
      actorUserId,
      action: allowed ? 'policy.allow' : 'policy.deny',
      resource,
      payload: {
        action,
        allowed,
        reason,
        policyDecisionId,
        ip,
        ua,
        geo,
      },
    });
  }

  /**
   * Log Data Access
   */
  async logDataAccess(
    actorUserId: number,
    targetType: string,
    targetId: number,
    fields: string[],
    filters: any,
    ip: string,
    ua: string,
  ): Promise<void> {
    await this.auditLog.logAccess({
      actorUserId,
      userId: 0, // Data access logs usually don't have a target user, they have a target resource
      action: 'read',
      targetType,
      targetId,
      metadata: {
        fields,
        filters,
        ip,
        ua,
      },
    });
  }

  /**
   * Log Security Event (General)
   */
  async logSecurityEvent(
    event: string, // e.g. "session.created", "session.revoked", "device.trusted"
    actorUserId: number,
    resource: string,
    payload: any,
    ip: string,
    ua: string,
  ): Promise<void> {
    await this.auditLog.logAction({
      actorUserId,
      action: `security.${event}`,
      resource,
      payload: {
        ...payload,
        ip,
        ua,
      },
    });
  }
}
