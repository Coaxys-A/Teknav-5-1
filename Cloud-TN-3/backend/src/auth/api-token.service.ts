import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiTokenType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type IssuedApiToken = {
  token: string;
  id: number;
  expiresAt: Date | null;
};

@Injectable()
export class ApiTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async issueToken(
    type: ApiTokenType,
    options: { userId?: number; label?: string; ttlSeconds?: number } = {},
  ): Promise<IssuedApiToken> {
    const secret = randomBytes(32).toString('base64url');
    const tokenHash = await bcrypt.hash(secret, 12);
    const expiresAt = options.ttlSeconds ? new Date(Date.now() + options.ttlSeconds * 1000) : null;

    const apiToken = await this.prisma.apiToken.create({
      data: {
        type,
        label: options.label,
        userId: options.userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      token: this.composeToken(apiToken.id, secret),
      id: apiToken.id,
      expiresAt,
    };
  }

  async verify(rawToken: string, type?: ApiTokenType) {
    const { id, secret } = this.splitToken(rawToken);
    const apiToken = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!apiToken) {
      throw new UnauthorizedException('API_TOKEN_NOT_FOUND');
    }
    if (apiToken.revokedAt) {
      throw new UnauthorizedException('API_TOKEN_REVOKED');
    }
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      throw new UnauthorizedException('API_TOKEN_EXPIRED');
    }
    if (type && apiToken.type !== type) {
      throw new UnauthorizedException('API_TOKEN_TYPE_MISMATCH');
    }

    const isValid = await bcrypt.compare(secret, apiToken.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('API_TOKEN_INVALID');
    }
    return apiToken;
  }

  async revoke(id: number) {
    await this.prisma.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  private composeToken(id: number, secret: string) {
    return `tok.${id}.${secret}`;
  }

  private splitToken(rawToken: string) {
    const parts = rawToken.split('.');
    if (parts.length < 3 || parts[0] !== 'tok') {
      throw new UnauthorizedException('API_TOKEN_INVALID_FORMAT');
    }
    const id = Number(parts[1]);
    if (Number.isNaN(id)) {
      throw new UnauthorizedException('API_TOKEN_INVALID_FORMAT');
    }
    const secret = parts.slice(2).join('.');
    return { id, secret };
  }
}
