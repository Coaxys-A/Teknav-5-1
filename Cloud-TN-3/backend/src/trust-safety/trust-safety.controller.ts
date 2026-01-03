import { Controller, Get, Param, ParseIntPipe, Post, UseGuards, Req } from '@nestjs/common';
import { TrustSafetyService } from './trust-safety.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('trust-safety')
export class TrustSafetyController {
  constructor(private readonly trust: TrustSafetyService) {}

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR)
  async list(@Req() req: any) {
    return this.trust.listReports(req?.tenantId ?? null, undefined);
  }

  @Post('reports/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR)
  async close(@Param('id', ParseIntPipe) id: number) {
    return this.trust.resolve(id, 'closed');
  }

  @Post('reports/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR)
  async reject(@Param('id', ParseIntPipe) id: number) {
    return this.trust.resolve(id, 'rejected');
  }
}
