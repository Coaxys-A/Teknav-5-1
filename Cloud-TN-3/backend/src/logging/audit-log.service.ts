import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

/**
 * Audit Log Service
 *
 * Logs actions and data access.
 * Signs payloads with HMAC for tamper awareness.
 */

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly SERVER_SECRET = process.env.SERVER_SECRET || 'change-me-in-production';

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Log an action (create, update, delete)
   */
  async logAction(data: {
    actorId?: number;
    action: string;
    resource: string;
    payload?: any;
    ip?: string;
    ua?: string;
    tenantId?: string;
  }): Promise<void> {
    const { actorId, action, resource, payload, ip, ua, tenantId } = data;

    // Sign payload
    const signedPayload = this.signPayload(payload || {});

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action,
        resource,
        payload: signedPayload,
        ip,
        ua,
        tenantId,
        createdAt: new Date(),
      },
    });

    this.logger.debug(`Action logged: ${action} for ${resource}`);
  }

  /**
   * Log data access (read)
   */
  async logAccess(data: {
    actorUserId?: number;
    userId: number; // The user whose data was accessed
    action: string;
    targetType: string;
    targetId: number;
    metadata?: any;
    tenantId?: string;
  }): Promise<void> {
    const { actorUserId, userId, action, targetType, targetId, metadata, tenantId } = data;

    // Create data access log
    await this.prisma.dataAccessLog.create({
      data: {
        actorUserId,
        userId,
        action,
        targetType,
        targetId,
        metadata,
        tenantId,
        createdAt: new Date(),
      },
    });

    this.logger.debug(`Data access logged: ${action} on ${targetType}:${targetId}`);
  }

  /**
   * Sign payload with HMAC
   */
  signPayload(payload: any): any {
    const payloadWithoutSig = JSON.parse(JSON.stringify(payload));
    const sig = createHmac('sha256', this.SERVER_SECRET)
      .update(JSON.stringify(payloadWithoutSig))
      .digest('hex');

    payload.meta = payload.meta || {};
    payload.meta.sig = sig;

    return payload;
  }
}
