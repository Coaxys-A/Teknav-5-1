import { Injectable, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class SecurityService {
  private readonly banWindowSeconds = 900;
  private readonly banThreshold = 5;
  private readonly banDurationSeconds = 3600;

  constructor(private readonly redis: RedisService, private readonly logging: LoggingService) {}

  private banKey(ip: string) {
    return `sec:ban:${ip}`;
  }

  private attemptKey(userId: number | null, ip: string) {
    return `sec:attempt:${userId ?? 'anon'}:${ip}`;
  }

  async checkBan(ip: string) {
    const banned = await this.redis.get<string>(this.banKey(ip));
    if (banned) {
      throw new ForbiddenException('IP_BANNED');
    }
  }

  async recordLoginAttempt(userId: number | null, ip: string, success: boolean, geo?: string) {
    const attemptK = this.attemptKey(userId, ip);
    const count = Number((await this.redis.get(attemptK)) ?? 0) + 1;
    await this.redis.set(attemptK, count, this.banWindowSeconds);
    if (!success && count >= this.banThreshold) {
      await this.redis.set(this.banKey(ip), `banned:${Date.now()}`, this.banDurationSeconds);
      await this.logging.logSensitive('login_ban', { userId: userId ?? undefined, ip, geo });
    }
    if (success) {
      await this.redis.del(attemptK);
    }
  }

  async issueCsrf(sessionId: string, token: string) {
    await this.redis.set(`csrf:${sessionId}`, token, 3600 * 24);
    return token;
  }

  async validateCsrf(sessionId: string | null, token?: string | null) {
    if (!sessionId) throw new ForbiddenException('CSRF_SESSION_REQUIRED');
    if (!token) throw new ForbiddenException('CSRF_TOKEN_MISSING');
    const stored = await this.redis.get<string>(`csrf:${sessionId}`);
    if (!stored || stored !== token) {
      throw new ForbiddenException('CSRF_TOKEN_INVALID');
    }
    return true;
  }
}
