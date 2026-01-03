import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(name: string, ownerId: number | undefined, scopes: string[], rateLimit = 1000) {
    const key = `tk_${Math.random().toString(36).slice(2)}${Date.now()}`;
    const hash = await bcrypt.hash(key, 10);
    const record = await this.prisma.apiClient.create({
      data: {
        name,
        ownerId: ownerId ?? null,
        apiKeyHash: hash,
        scopes: scopes as any,
        rateLimit,
      },
    });
    await this.audit.log('api_key.create', ownerId, { apiClientId: record.id });
    return { key, record };
  }

  async revoke(id: number) {
    return this.prisma.apiClient.update({ where: { id }, data: { status: 'revoked' } });
  }

  async validate(key: string, scope?: string) {
    const clients = await this.prisma.apiClient.findMany({ where: { status: 'active' } });
    for (const c of clients) {
      if (await bcrypt.compare(key, c.apiKeyHash)) {
        if (scope) {
          const scopes = (c.scopes as string[]) ?? [];
          if (!scopes.includes(scope)) throw new UnauthorizedException('SCOPE_DENIED');
        }
        return c;
      }
    }
    throw new UnauthorizedException('INVALID_API_KEY');
  }
}
