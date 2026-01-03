import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

/**
 * Session Service - Wraps Prisma Session + Redis Cache
 */

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Create session on login
   */
  async createSession(params: {
    userId: number;
    ip: string;
    ua: string;
    expiresAt: Date;
  }) {
    this.logger.debug(`Creating session for user ${params.userId}`);

    const session = await this.prisma.session.create({
      data: {
        id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: params.userId,
        refreshTokenHash: 'hash_placeholder', // In production, use crypto hash
        expiresAt: params.expiresAt,
        revokedAt: null,
        createdAt: new Date(),
      },
    });

    // Cache session in Redis for fast validation
    const cacheKey = this.getCacheKey(session.id);
    await this.redis.set(cacheKey, JSON.stringify({
      userId: params.userId,
      role: 'USER', // In production, fetch from User
      tenantId: null, // In production, fetch from User
      workspaceId: null, // In production, fetch from User
    }), 60 * 60 * 24); // 24 hours TTL

    this.logger.debug(`Session created: ${session.id}`);
    return session;
  }

  /**
   * Validate session
   * - Reads from Redis first
   * - Falls back to DB if missing
   * - Re-caches if found in DB
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; session?: any }> {
    const cacheKey = this.getCacheKey(sessionId);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const sessionData = JSON.parse(cached);
      if (sessionData?.userId) {
        return { valid: true, session: sessionData };
      }
    }

    // Fallback to DB lookup
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      return { valid: false };
    }

    // Check if session is revoked or expired
    if (session.revokedAt || (session.expiresAt && session.expiresAt < new Date())) {
      return { valid: false };
    }

    // Re-cache session in Redis
    const sessionData = {
      userId: session.userId,
      role: session.user.role,
      tenantId: session.user.tenantId, // In production, fetch from User
      workspaceId: null, // In production, fetch from User
    };
    await this.redis.set(cacheKey, JSON.stringify(sessionData), 60 * 60 * 24); // 24 hours TTL

    return { valid: true, session: sessionData };
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionId: string) {
    this.logger.debug(`Revoking session: ${sessionId}`);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    // Delete from Redis
    const cacheKey = this.getCacheKey(sessionId);
    await this.redis.del(cacheKey);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeUserSessions(userId: number) {
    this.logger.debug(`Revoking all sessions for user ${userId}`);

    await this.prisma.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    // Delete all Redis session keys for this user
    // (In production, iterate through all session keys for user)
  }

  /**
   * Get cache key for session
   */
  private getCacheKey(sessionId: string): string {
    return `sess:${sessionId}`;
  }
}
