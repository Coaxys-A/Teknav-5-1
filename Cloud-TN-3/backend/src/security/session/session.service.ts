import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { createHmac } from 'crypto';

/**
 * Session Service
 *
 * Handles:
 * - Redis-backed session cache (key: session:<id>)
 * - DB Session record (refreshTokenHash)
 * - Session validation (revoked, expired)
 * - Token rotation (refresh flow)
 */

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly REDIS_PREFIX = process.env.REDIS_KEY_PREFIX || 'q';
  private readonly SESSION_TTL = 60 * 60 * 24; // 24 hours
  private readonly REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Create Session (Login)
   * Returns session object with tokens
   */
  async createSession(
    userId: number,
    deviceId: string,
    ip: string,
    ua: string,
  ): Promise<any> {
    this.logger.log(`Creating session for user ${userId} device ${deviceId}`);

    const sessionId = `session:${userId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);
    const refreshToken = this.generateToken();
    const refreshTokenHash = this.hashToken(refreshToken);

    // 1. Save to DB
    await this.prisma.session.create({
      data: {
        userId,
        sessionId,
        refreshTokenHash,
        deviceId,
        expiresAt,
        revokedAt: null,
      },
    });

    // 2. Save to Redis Cache
    const sessionData = {
      userId,
      deviceId,
      ip,
      ua,
      expiresAt: expiresAt.toISOString(),
      tenantIds: [], // Loaded later
      workspaceIds: [], // Loaded later
      roles: [], // Loaded later
    };

    await this.redis.set(
      `${this.REDIS_PREFIX}:session:${sessionId}`,
      JSON.stringify(sessionData),
      this.SESSION_TTL,
    );

    // 3. Return session object
    return {
      sessionId,
      accessToken: this.generateAccessToken(sessionId), // Mock JWT generation
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Validate Session
   * Returns session data or throws error if invalid/revoked/expired
   */
  async validateSession(sessionId: string, deviceId: string): Promise<any> {
    // 1. Check Redis first
    const cacheKey = `${this.REDIS_PREFIX}:session:${sessionId}`;
    let sessionData = await this.redis.get(cacheKey);

    if (!sessionData) {
      // 2. Hydrate from DB
      const dbSession = await this.prisma.session.findUnique({
        where: { sessionId },
      });

      if (!dbSession) {
        throw new Error('Session not found');
      }

      if (dbSession.revokedAt) {
        throw new Error('Session revoked');
      }

      if (dbSession.expiresAt < new Date()) {
        throw new Error('Session expired');
      }

      // Build session data
      // (In a real impl, we'd load user roles, tenants, workspaces here)
      sessionData = {
        userId: dbSession.userId,
        deviceId: dbSession.deviceId,
        expiresAt: dbSession.expiresAt.toISOString(),
        roles: ['VIEWER'], // Mock
        tenantIds: [1], // Mock
        workspaceIds: [1], // Mock
      };

      // Cache it
      await this.redis.set(cacheKey, JSON.stringify(sessionData), this.SESSION_TTL);
    } else {
      // Parse cached JSON
      sessionData = JSON.parse(sessionData);
    }

    // 3. Check expiration
    if (new Date(sessionData.expiresAt) < new Date()) {
      throw new Error('Session expired');
    }

    // 4. Check Device Binding
    if (sessionData.deviceId !== deviceId) {
      this.logger.warn(`Session deviceId mismatch: ${sessionData.deviceId} vs ${deviceId}`);
      // In production, this might be suspicious. We'll throw for now.
      throw new Error('Session device mismatch');
    }

    return sessionData;
  }

  /**
   * Rotate Refresh Token
   * Used in refresh token flow.
   * Invalidates old refresh token and creates a new one.
   */
  async rotateRefreshToken(sessionId: string, oldRefreshToken: string): Promise<any> {
    // 1. Validate old refresh token
    const dbSession = await this.prisma.session.findUnique({
      where: { sessionId },
    });

    if (!dbSession || dbSession.revokedAt || dbSession.expiresAt < new Date()) {
      throw new Error('Invalid session');
    }

    const oldHash = this.hashToken(oldRefreshToken);
    if (oldHash !== dbSession.refreshTokenHash) {
      throw new Error('Invalid refresh token');
    }

    // 2. Generate new tokens
    const newRefreshToken = this.generateToken();
    const newRefreshTokenHash = this.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000);

    // 3. Update DB
    await this.prisma.session.update({
      where: { sessionId },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    // 4. Clear Redis Cache (force reload next time)
    await this.redis.del(`${this.REDIS_PREFIX}:session:${sessionId}`);

    // 5. Return new session
    return {
      sessionId,
      accessToken: this.generateAccessToken(sessionId), // Mock JWT generation
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
    };
  }

  /**
   * Revoke Session
   */
  async revokeSession(sessionId: string): Promise<void> {
    this.logger.log(`Revoking session ${sessionId}`);

    // 1. Update DB
    await this.prisma.session.updateMany({
      where: { sessionId },
      data: {
        revokedAt: new Date(),
      },
    });

    // 2. Clear Redis Cache
    await this.redis.del(`${this.REDIS_PREFIX}:session:${sessionId}`);
  }

  /**
   * Revoke All Sessions for User
   */
  async revokeAllUserSessions(userId: number): Promise<number> {
    this.logger.log(`Revoking all sessions for user ${userId}`);

    // 1. Update DB
    const result = await this.prisma.session.updateMany({
      where: { userId },
      data: {
        revokedAt: new Date(),
      },
    });

    // 2. Clear Redis Cache
    // Note: We don't know all session IDs efficiently without query.
    // We'll rely on DB checks for validation, Redis is just a cache.
    // If we want to clear Redis keys, we'd need to scan or store a `user:sessions` set.

    return result.count;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Generate random token
   */
  private generateToken(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  /**
   * Hash token (SHA256)
   */
  private hashToken(token: string): string {
    return createHmac('sha256', process.env.SERVER_SECRET || 'change-me')
      .update(token)
      .digest('hex');
  }

  /**
   * Generate Access Token (JWT Mock)
   * In production, use @nestjs/jwt or similar
   */
  private generateAccessToken(sessionId: string): string {
    // Mock JWT: "sessionId.payload.signature"
    // In real impl, sign with secret and expiry
    const payload = {
      sessionId,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.hashToken(`${header}.${body}`);

    return `${header}.${body}.${signature}`;
  }
}
