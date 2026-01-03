import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { PolicyRulesService } from '../../security/policy/policy.rules.service';
import { SessionService } from '../../security/session/session.service';
import { DeviceService } from '../../security/device/device.service';
import { AbuseDetectionService } from '../../security/abuse/abuse.service';
import { SecurityLogService } from '../../security/logging/security-log.service';

/**
 * Owner Security Service
 *
 * Handles Owner Security operations:
 * - Audit/Access Logs (list, search, export)
 * - Sessions (list, revoke, revoke-all)
 * - Devices (list, trust, untrust)
 * - RBAC (list rules, save overrides)
 * - Bans (list, unban)
 * - Rate Limits (list, clear)
 */

@Injectable()
export class OwnerSecurityService {
  private readonly logger = new Logger(OwnerSecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
    private readonly policyRules: PolicyRulesService,
    private readonly session: SessionService,
    private readonly device: DeviceService,
    private readonly abuse: AbuseDetectionService,
    private readonly securityLog: SecurityLogService,
  ) {}

  // ==========================================================================
  // LOGS: AUDIT & ACCESS
  // ==========================================================================

  async getAuditLogs(filters: any): Promise<any> {
    const { page = 1, pageSize = 20, startDate, endDate, action, resource, actorId } = filters;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { lte: new Date(endDate) };
    if (action) where.action = { contains: action };
    if (resource) where.resource = { contains: resource };
    if (actorId) where.actorUserId = actorId;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: start,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      page,
      pageSize,
      total,
    };
  }

  async getAccessLogs(filters: any): Promise<any> {
    const { page = 1, pageSize = 20, startDate, endDate, targetType, targetId, actorId } = filters;

    const where: any = {
      action: 'read', // Access logs are 'read' actions
    };
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { lte: new Date(endDate) };
    if (targetType) where.targetType = { contains: targetType };
    if (targetId) where.targetId = targetId;
    if (actorId) where.actorUserId = actorId;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.dataAccessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: start,
      }),
      this.prisma.dataAccessLog.count({ where }),
    ]);

    return {
      data: logs,
      page,
      pageSize,
      total,
    };
  }

  async exportLogs(type: 'audit' | 'access', filters: any): Promise<void> {
    // Enqueue export job via Queue (from Part 21)
    // Mock for now
    this.logger.log(`Enqueue export job for type ${type}`);
  }

  // ==========================================================================
  // SESSIONS
  // ==========================================================================

  async getSessions(filters: any): Promise<any> {
    const { page = 1, pageSize = 20, userId } = filters;

    const where: any = {};
    if (userId) where.userId = userId;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: start,
        select: {
          id: true,
          sessionId: true,
          userId: true,
          deviceId: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: sessions,
      page,
      pageSize,
      total,
    };
  }

  async revokeSession(sessionId: string, actorId: number): Promise<void> {
    await this.session.revokeSession(sessionId);
    await this.securityLog.logSecurityEvent('session.revoked', actorId, 'Session', { sessionId }, '', '');
  }

  async revokeAllUserSessions(userId: number, actorId: number): Promise<number> {
    const count = await this.session.revokeAllUserSessions(userId);
    await this.securityLog.logSecurityEvent('session.revoke-all', actorId, 'User', { userId }, '', '');
    return count;
  }

  // ==========================================================================
  // DEVICES
  // ==========================================================================

  async getDevices(filters: any): Promise<any> {
    const { page = 1, pageSize = 20, userId } = filters;

    const where: any = {};
    if (userId) where.userId = userId;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const [devices, total] = await Promise.all([
      this.prisma.userDevice.findMany({
        where,
        orderBy: { lastUsed: 'desc' },
        take: pageSize,
        skip: start,
      }),
      this.prisma.userDevice.count({ where }),
    ]);

    return {
      data: devices,
      page,
      pageSize,
      total,
    };
  }

  async trustDevice(userId: number, deviceId: string, actorId: number): Promise<void> {
    await this.device.trustDevice(userId, deviceId);
    await this.securityLog.logSecurityEvent('device.trusted', actorId, 'UserDevice', { userId, deviceId }, '', '');
  }

  async untrustDevice(userId: number, deviceId: string, actorId: number): Promise<void> {
    await this.device.untrustDevice(userId, deviceId);
    await this.securityLog.logSecurityEvent('device.untrusted', actorId, 'UserDevice', { userId, deviceId }, '', '');
  }

  // ==========================================================================
  // RBAC
  // ==========================================================================

  async getRbacRules(tenantId: number): Promise<any> {
    const policyDoc = await this.policyRules.getPolicyDocument(tenantId);
    return { data: policyDoc };
  }

  async saveRbacRule(tenantId: number, rule: any, actorId: number): Promise<void> {
    await this.policyRules.saveOverride(tenantId, rule, actorId);
    await this.securityLog.logSecurityEvent('rbac.rule.saved', actorId, 'PolicyRule', { tenantId, ruleId: rule.id }, '', '');
  }

  // ==========================================================================
  // BANS
  // ==========================================================================

  async getBans(filters: any): Promise<any> {
    const { page = 1, pageSize = 20, type } = filters;

    // Note: Bans are stored in Redis. We need to list them.
    // We don't have a Redis `scan` or `keys` method that is efficient in this abstraction.
    // For this MVP, we'll assume we have a list of keys or use a pattern.
    // Since we can't scan Redis easily here, we'll return an empty list and rely on the Owner UI to display real bans if we had a better Redis client.
    // We'll mock it.

    return {
      data: [], // Real impl would scan Redis for keys like `ban:user:*` and `ban:ip:*`
      page,
      pageSize,
      total: 0,
    };
  }

  async unban(identifier: string, type: 'user' | 'ip', actorId: number): Promise<void> {
    await this.abuse.unban(identifier, type);
    await this.securityLog.logSecurityEvent('ban.unbanned', actorId, 'Ban', { identifier, type }, '', '');
  }

  // ==========================================================================
  // RATE LIMITS
  // ==========================================================================

  async getRateLimitCounters(filters: any): Promise<any> {
    const { type } = filters;

    // Note: Counters are stored in Redis. Similar to bans, scanning is hard.
    // We'll return empty list for now.
    // Real impl would scan Redis for keys like `token:usage:*`, `abuse:brute:user:*`, `abuse:ratelimit:ip:*`

    return {
      data: [], // Real impl would scan Redis
      page: 1,
      pageSize: 20,
      total: 0,
    };
  }

  async clearRateLimit(identifier: string, type: 'user' | 'ip' | 'token', actorId: number): Promise<void> {
    if (type === 'user') {
      await this.abuse.clearBruteForce(parseInt(identifier));
    } else if (type === 'ip') {
      await this.abuse.clearRateLimit(identifier);
    } else if (type === 'token') {
      // Mock: `clearTokenUsage` doesn't exist in AbuseService
      this.logger.warn(`clearRateLimit for token not implemented`);
    }

    await this.securityLog.logSecurityEvent('ratelimit.cleared', actorId, 'RateLimit', { identifier, type }, '', '');
  }
}
