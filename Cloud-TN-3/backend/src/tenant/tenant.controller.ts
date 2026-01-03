import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantConfigService } from './tenant-config.service';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenants: TenantService,
    private readonly tenantConfig: TenantConfigService,
  ) {}

  @Get('current')
  async current(@Req() req: any) {
    const tenantId = req.tenantId as number | undefined;
    if (!tenantId) throw new UnauthorizedException('Tenant not resolved');
    const tenant = await this.tenants.getTenantByIdOrSlug(tenantId);
    const config = await this.tenantConfig.getConfig(tenant.id);
    return { tenant, config };
  }
}
