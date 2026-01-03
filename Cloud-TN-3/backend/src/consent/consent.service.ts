import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CONSENT_TYPES = ['analytics', 'marketing_emails', 'personalization', 'ab_testing'];

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async getConsents(userId: number) {
    const consents = await (this.prisma as any).userConsent.findMany({ where: { userId } });
    const map = Object.fromEntries(consents.map((c: any) => [c.consentType, c]));
    return CONSENT_TYPES.map((type) => map[type] ?? { consentType: type, status: 'unknown' });
  }

  async setConsents(userId: number, updates: { type: string; status: string }[]) {
    for (const u of updates) {
      if (!CONSENT_TYPES.includes(u.type)) continue;
      await (this.prisma as any).userConsent.upsert({
        where: { userId_consentType: { userId, consentType: u.type } },
        update: { status: u.status, source: 'user' },
        create: { userId, consentType: u.type, status: u.status, source: 'user' },
      });
    }
    return this.getConsents(userId);
  }
}
