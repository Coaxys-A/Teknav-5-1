import { Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Session Service
 *
 * Handles session management.
 * Currently simplified to assume session is in request object (or via Passport).
 * In a full implementation, this would handle Redis storage, TTL, etc.
 */

export interface Session {
  userId: number;
  role: string;
  tenantId: string;
  workspaceId?: string;
  [key: string]: any;
}

@Injectable()
export class SessionService {
  /**
   * Get session from request
   * Assumes session is attached to request by authentication middleware
   */
  async getFromRequest(req: Request): Promise<Session | null> {
    // Try to get session from request object
    // This usually comes from Passport (req.user) or custom session middleware
    const session = (req as any).session || (req as any).user;

    if (!session || !session.userId) {
      return null;
    }

    return {
      userId: session.userId,
      role: session.role || 'VIEWER', // Default role
      tenantId: session.tenantId,
      workspaceId: session.workspaceId,
    };
  }

  /**
   * Save session to request (no-op for now)
   */
  async save(req: Request, session: any): Promise<void> {
    (req as any).session = session;
  }

  /**
   * Destroy session
   */
  async destroy(req: Request): Promise<void> {
    (req as any).session = null;
    // In a full implementation, this would remove session from Redis
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUser(userId: number): Promise<void> {
    // In a full implementation, this would remove all sessions for user from Redis
  }
}
