import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantConfigService } from './tenant-config.service';

@Module({
  imports: [PrismaModule],
  providers: [TenantService, TenantConfigService],
  controllers: [TenantController],
  exports: [TenantService, TenantConfigService],
})
export class TenantModule {}
