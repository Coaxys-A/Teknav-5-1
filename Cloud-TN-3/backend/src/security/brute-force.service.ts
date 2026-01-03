import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { AuditLogService } from '../logging/audit-log.service';

/**
 * Brute Force Protection Service
 */

@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);
  private readonly MAX_ATTEMPTS = parseInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS || '5');
  private readonly WINDOW_SECONDS = parseInt(process.env.BRUTE_FORCE_WINDOW_SEC || '300'); // 5 min
  private readonly BAN_IP_TTL_SECONDS = 15 * 60; // 15 min
  private readonly BAN_USER_TTL_SECONDS = 30 * 60; // 30 min

  constructor(
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Check if IP is banned
   */
  async isIpBanned(ip: string): Promise<boolean> {
    const banKey = this.getBanKey('ip', ip);
    const isBanned = await this.redis.exists(banKey);
    return isBanned === 1;
  }

  /**
   * Check if user/email is banned
   */
  async isUserBanned(userIdentifier: string): Promise<boolean> {
    const banKey = this.getBanKey('user', userIdentifier);
    const isBanned = await this.redis.exists(banKey);
    return isBanned === 1;
  }

  /**
   * Check login attempts and enforce brute-force
   */
  async checkLoginAttempt(params: {
    ip: string;
    emailOrId: string;
    success: boolean;
    userId?: number;
    tenantId?: number;
    workspaceId?: number;
  }) {
    const { ip, emailOrId, success, userId, tenantId, workspaceId } = params;

    const ipKey = this.getAttemptKey('ip', ip);
    const userKey = this.getAttemptKey('user', emailOrId);

    // Check if already banned
    const ipBanned = await this.isIpBanned(ip);
    const userBanned = await this.isUserBanned(emailOrId);

    if (ipBanned) {
      this.logger.warn(`IP ${ip} is banned (brute-force)`);
      throw new ForbiddenException('IP is temporarily banned due to too many failed login attempts');
    }

    if (userBanned) {
      this.logger.warn(`User ${emailOrId} is banned (brute-force)`);
      throw new ForbiddenException('Account is temporarily locked due to too many failed login attempts');
    }

    if (success) {
      // Successful login: reset counters
      await this.resetLoginAttempts(ip, emailOrId);
    } else {
      // Failed login: increment counters
      const ipAttempts = await this.redis.incr(ipKey);
      await this.redis.set(ipKey, ipAttempts.toString(), this.WINDOW_SECONDS);
      
      const userAttempts = await this.redis.incr(userKey);
      await this.redis.set(userKey, userAttempts.toString(), this.WINDOW_SECONDS);

      // Check if thresholds exceeded
      if (ipAttempts >= this.MAX_ATTEMPTS) {
        await this.banIp(ip);
        await this.auditLog.logAction({
          actorId: userId || null,
          action: 'security.ban_ip',
          resource: 'Login',
          payload: { ip, reason: 'brute-force' },
          ip,
          ua: 'unknown',
        });
      }

      if (userAttempts >= this.MAX_ATTEMPTS) {
        await this.banUser(emailOrId);
        await this.auditLog.logAction({
          actorId: userId || null,
          action: 'security.ban_user',
          resource: 'Account',
          payload: { emailOrId, reason: 'brute-force' },
          ip,
          ua: 'unknown',
        });
      }

      this.logger.warn(`Failed login attempt: ip=${ip} (${ipAttempts}/${this.MAX_ATTEMPTS}), user=${emailOrId} (${userAttempts}/${this.MAX_ATTEMPTS})`);
    }
  }

  /**
   * Reset login attempts (on successful login)
   */
  async resetLoginAttempts(ip: string, emailOrId: string) {
    const ipKey = this.getAttemptKey('ip', ip);
    const userKey = this.getAttemptKey('user', emailOrId);

    await Promise.all([
      this.redis.del(ipKey),
      this.redis.del(userKey),
    ]);

    this.logger.debug(`Login attempts reset for ip=${ip}, user=${emailOrId}`);
  }

  /**
   * Ban IP
   */
  async banIp(ip: string) {
    const banKey = this.getBanKey('ip', ip);
    await this.redis.set(banKey, '1', this.BAN_IP_TTL_SECONDS);
    this.logger.warn(`IP ${ip} banned for ${this.BAN_IP_TTL_SECONDS}s`);
  }

  /**
   * Ban User
   */
  async banUser(userIdentifier: string) {
    const banKey = this.getBanKey('user', userIdentifier);
    await this.redis.set(banKey, '1', this.BAN_USER_TTL_SECONDS);
    this.logger.warn(`User ${userIdentifier} banned for ${this.BAN_USER_TTL_SECONDS}s`);
  }

  /**
   * Unban IP
   */
  async unbanIp(ip: string) {
    const banKey = this.getBanKey('ip', ip);
    await this.redis.del(banKey);
    await this.resetLoginAttempts(ip, 'any'); // Reset attempts too
    this.logger.debug(`IP ${ip} unbanned`);
  }

  /**
   * Unban User
   */
  async unbanUser(userIdentifier: string) {
    const banKey = this.getBanKey('user', userIdentifier);
    await this.redis.del(banKey);
    await this.resetLoginAttempts('any', userIdentifier); // Reset attempts too
    this.logger.debug(`User ${userIdentifier} unbanned`);
  }

  /**
   * Get ban info
   */
  async getBanInfo(type: 'ip' | 'user', identifier: string) {
    const banKey = this.getBanKey(type, identifier);
    const isBanned = await this.redis.exists(banKey);

    if (!isBanned) {
      return { banned: false };
    }

    // Get TTL
    const ttl = await this.redis.ttl(banKey);
    return {
      banned: true,
      ttl,
      expiresAt: Date.now() + (ttl * 1000),
    };
  }

  /**
   * Get attempt key for rate limiting
   */
  private getAttemptKey(type: 'ip' | 'user', identifier: string): string {
    return `bf:${type}:${identifier}`;
  }

  /**
   * Get ban key
   */
  private getBanKey(type: 'ip' | 'user', identifier: string): string {
    return `ban:${type}:${identifier}`;
  }
}
