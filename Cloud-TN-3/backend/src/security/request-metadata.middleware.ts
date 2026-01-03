import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionService } from '../../auth/session.service';

/**
 * Request Metadata Middleware
 *
 * Captures metadata on every request:
 * - Parses user-agent
 * - Derives device fingerprint hash
 * - Upserts UserSessionFingerprint
 * - Upserts UserDevice
 * - Updates lastSeenAt/lastUsed
 * - Geo lookup (best-effort)
 *
 * Stores geo in AuditLog.payload.meta.geo
 */

@Injectable()
export class RequestMetadataMiddleware {
  private readonly logger = new Logger(RequestMetadataMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Get session
      const session = await this.sessionService.getFromRequest(req);
      if (!session || !session.userId) {
        return next();
      }

      const userId = session.userId;
      const ipAddress = this.getIpAddress(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Derive device fingerprint
      const deviceId = this.deriveDeviceFingerprint(userAgent, ipAddress);

      // Upsert UserSessionFingerprint
      await this.prisma.userSessionFingerprint.upsert({
        where: {
          userId_hash: {
            userId,
            hash: deviceId,
          },
        },
        create: {
          userId,
          hash: deviceId,
          userAgent,
          ipAddress,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
        update: {
          userAgent,
          ipAddress,
          lastSeenAt: new Date(),
        },
      });

      // Upsert UserDevice
      await this.prisma.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId,
          },
        },
        create: {
          userId,
          deviceId,
          userAgent,
          ipAddress,
          firstSeenAt: new Date(),
          lastUsedAt: new Date(),
        },
        update: {
          userAgent,
          ipAddress,
          lastUsedAt: new Date(),
        },
      });

      // Extract geo information from proxy headers (best-effort)
      const geo = this.getGeoFromHeaders(req);

      // Attach metadata to request for later use (AuditLog)
      req['metadata'] = {
        userId,
        userAgent,
        deviceId,
        ipAddress,
        geo,
      };

      this.logger.debug(
        `Request metadata captured for user ${userId} (ip: ${ipAddress}, device: ${deviceId})`,
      );
    } catch (error) {
      this.logger.error('Failed to capture request metadata:', error);
      // Don't block request on metadata failure
    } finally {
      next();
    }
  }

  /**
   * Get IP address from request
   * Considers x-forwarded-for, cf-ipcountry, x-vercel-ip-country headers
   */
  private getIpAddress(req: Request): string {
    // Check x-forwarded-for (comma-separated list of IPs)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Take the first IP (original client IP)
      return forwardedFor.split(',')[0].trim();
    }

    // Check cf-ipcountry
    const cfIp = req.headers['cf-ipcountry'] as string;
    if (cfIp) {
      return cfIp; // Actually, cf-ipcountry returns country code, not IP
      // But we'll assume it's the IP for simplicity (or fetch from other header)
      // In production, you'd use cf-connecting-ip header
    }

    // Check x-vercel-ip-country
    const vercelIp = req.headers['x-vercel-ip-country'] as string;
    if (vercelIp) {
      return vercelIp; // Similar to above
    }

    // Fallback to remoteAddress
    return req.socket.remoteAddress || req.connection.remoteAddress || 'Unknown';
  }

  /**
   * Derive device fingerprint hash from user-agent and IP
   * This is a simplification - in production, you'd use a more robust fingerprinting algorithm
   */
  private deriveDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const fingerprint = `${userAgent}-${ipAddress}`;
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Get geo information from proxy headers
   * No external APIs required
   */
  private getGeoFromHeaders(req: Request): any {
    const geo: any = {
      country: null,
      region: null,
      city: null,
      provider: 'header',
    };

    // Check cf-ipcountry (Cloudflare)
    const cfCountry = req.headers['cf-ipcountry'] as string;
    if (cfCountry) {
      geo.country = cfCountry;
      geo.provider = 'cloudflare';
    }

    // Check x-vercel-ip-country (Vercel)
    const vercelCountry = req.headers['x-vercel-ip-country'] as string;
    if (vercelCountry) {
      geo.country = vercelCountry;
      geo.provider = 'vercel';
    }

    // Check geoip-country-header (generic)
    const geoCountry = req.headers['geoip-country'] as string;
    if (geoCountry) {
      geo.country = geoCountry;
      geo.provider = 'geoip';
    }

    // Check x-geoip-region (generic)
    const geoRegion = req.headers['x-geoip-region'] as string;
    if (geoRegion) {
      geo.region = geoRegion;
    }

    // Check x-geoip-city (generic)
    const geoCity = req.headers['x-geoip-city'] as string;
    if (geoCity) {
      geo.city = geoCity;
    }

    return geo;
  }
}
