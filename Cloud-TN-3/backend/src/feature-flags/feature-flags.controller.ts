import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OWNER)
  async list() {
    return this.flags.list();
  }

  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  async upsert(
    @Body()
    body: {
      key: string;
      description?: string;
      type: string;
      variants: any[];
      defaultVariant: string;
      targetingRules?: any[];
      isActive?: boolean;
    },
  ) {
    return this.flags.setFlag(body);
  }

  @Get('resolve/:key')
  async resolve(@Param('key') key: string) {
    return { variant: await this.flags.resolve(key, {}) };
  }
}
