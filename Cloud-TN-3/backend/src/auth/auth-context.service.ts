import { Injectable, ExecutionContext } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface AuthContext {
  userId: number | null;
  role: string | null;
  workspaceId: number | null;
  workspaceRole: string | null;
  tenantId: number | null;
  ip: string;
  ua: string;
}

@Injectable()
export class AuthContextService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Extract and normalize auth context from request
   */
  async getContext(request: any): Promise<AuthContext> {
    const userId = request.user?.id || null;
    const role = request.user?.role || null;
    const workspaceId = request.user?.workspaceId || null;
    const workspaceRole = request.user?.workspaceRole || null;
    const tenantId = request.user?.tenantId || null;

    // Resolve tenantId from workspace if workspaceId is present
    let resolvedTenantId = tenantId;
    if (workspaceId && !tenantId) {
      resolvedTenantId = await this.resolveTenantFromWorkspace(workspaceId);
    }

    return {
      userId,
      role,
      workspaceId,
      workspaceRole,
      tenantId: resolvedTenantId,
      ip: this.getClientIp(request),
      ua: this.getClientUA(request),
    };
  }

  /**
   * Resolve tenant ID from workspace (cached in Redis)
   */
  private async resolveTenantFromWorkspace(workspaceId: number): Promise<number | null> {
    const cacheKey = `workspace:${workspaceId}:tenant`;
    
    // Try Redis first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return parseInt(cached);
    }

    // Fallback to DB lookup (will be cached after)
    // In real implementation, fetch from Workspace table
    // For now, return null
    return null;
  }

  /**
   * Cache workspace membership resolution
   */
  async cacheWorkspaceMembership(workspaceId: number, tenantId: number) {
    const cacheKey = `workspace:${workspaceId}:tenant`;
    await this.redis.set(cacheKey, tenantId.toString(), 60); // 60s TTL
  }

  private getClientIp(request: any): string {
    return request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || '127.0.0.1';
  }

  private getClientUA(request: any): string {
    return request.headers?.['user-agent'] || request.headers?.['User-Agent'] || 'unknown';
  }
}
