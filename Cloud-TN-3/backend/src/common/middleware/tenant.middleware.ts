import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantService } from '../../tenant/tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenants: TenantService) {}

  async use(req: any, res: any, next: () => void) {
    const tenantHeader = (req.headers['x-teknav-tenant'] ||
      req.headers['x-tenant-id'] ||
      req.headers['x-tenant-slug']) as string | undefined;
    const host = req.headers['host'] as string | undefined;
    const tenant = await this.tenants.resolveTenant(host, tenantHeader ?? null);
    if (tenant) {
      req.tenantId = tenant.id;
      req.tenant = tenant;
    }
    next();
  }
}
