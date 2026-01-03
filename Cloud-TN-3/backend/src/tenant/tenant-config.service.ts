import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CachedConfig = {
  expiresAt: number;
  config: any;
};

const DEFAULT_CONFIG = {
  branding: {
    colors: {
      primary: '#0f172a',
      secondary: '#2563eb',
      accent: '#22c55e',
      background: '#0b1021',
      surface: '#111827',
      text: '#e5e7eb',
    },
    logo: '',
    typography: {
      fontFamily: '"Vazirmatn", "Vazir", "IRANYekan", sans-serif',
    },
  },
  features: {
    comments: true,
    marketplace: true,
    experiments: true,
    aiStudio: true,
    workflows: true,
  },
  limits: {
    users: 100,
    workspaces: 10,
    apiRps: 100,
  },
  seo: {
    defaultTitleSuffix: ' | Teknav',
    indexable: true,
  },
  locales: {
    defaultLocale: 'fa',
    supportedLocales: ['fa'],
  },
};

@Injectable()
export class TenantConfigService {
  private cache = new Map<number, CachedConfig>();
  private ttlMs = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: number) {
    const cached = this.cache.get(tenantId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.config;
    }

    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: {
        configuration: true,
        limits: true,
        supportedLocales: true,
        defaultLocale: true,
        displayName: true,
      },
    });

    const merged = {
      ...DEFAULT_CONFIG,
      ...tenant?.configuration,
      limits: { ...DEFAULT_CONFIG.limits, ...(tenant?.limits as any) },
      locales: {
        defaultLocale: tenant?.defaultLocale ?? DEFAULT_CONFIG.locales.defaultLocale,
        supportedLocales: tenant?.supportedLocales ?? DEFAULT_CONFIG.locales.supportedLocales,
      },
      displayName: tenant?.displayName ?? 'Teknav',
    };

    this.cache.set(tenantId, { config: merged, expiresAt: now + this.ttlMs });
    return merged;
  }

  async isFeatureEnabled(tenantId: number, featureKey: string) {
    const config = await this.getConfig(tenantId);
    return Boolean(config?.features?.[featureKey]);
  }

  async getBranding(tenantId: number) {
    const config = await this.getConfig(tenantId);
    return config?.branding ?? DEFAULT_CONFIG.branding;
  }
}
