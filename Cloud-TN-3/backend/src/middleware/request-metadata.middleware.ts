import { Injectable, NestMiddleware, Logger, Request } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

/**
 * Request Metadata Middleware
 *
 * Extracts and attaches metadata to `request` object.
 * Metadata: IP, UA, DeviceID, RequestID, Geo (optional).
 * Uses trusted proxies headers.
 */

@Injectable()
export class RequestMetadataMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestMetadataMiddleware.name);

  async use(req: Request, res: any, next: () => void) {
    // 1. Extract IP
    // Check for X-Forwarded-For or X-Real-IP (trusted proxies)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const remoteAddress = req.socket.remoteAddress;

    let ip: string;
    if (realIp) {
      ip = realIp.split(',')[0].trim();
    } else if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else {
      ip = remoteAddress || 'unknown';
    }

    // 2. Extract User Agent
    const ua = req.headers['user-agent'] as string || 'unknown';

    // 3. Extract Device ID (from header or generate)
    let deviceId = req.headers['x-device-id'] as string || req.cookies['device_id'] as string;

    // 4. Generate Request ID (if not present)
    let requestId = req.headers['x-request-id'] as string;
    if (!requestId) {
      requestId = `req:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      req.headers['x-request-id'] = requestId;
    }

    // 5. Attach Metadata to Request
    req.ip = ip;
    req.ua = ua;
    req.deviceId = deviceId;
    req.requestId = requestId;
    req.sessionId = req.cookies['session_id'] || req.headers['authorization']?.split(' ')[1]; // Extract from header or cookie

    // 6. Geo Lookup (Lightweight)
    // In production, use a geo-ip service (e.g., ipinfo.io, MaxMind).
    // If no service configured, just record IP.
    // We'll store 'geo' key with IP only or country if available.
    req.geo = await this.lookupGeo(ip);

    next();
  }

  /**
   * Lookup Geo (Lightweight)
   * Returns { country, region, city } or just { ip }
   */
  private async lookupGeo(ip: string): Promise<any> {
    // Mock Geo Lookup
    // In production, call external service
    // Example: fetch(`http://ip-api.com/json/${ip}`)
    return {
      ip,
      country: 'Unknown', // Mock
      region: 'Unknown', // Mock
      city: 'Unknown', // Mock
    };
  }
}
