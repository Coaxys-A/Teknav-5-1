import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('logs')
  @Roles(Role.ADMIN, Role.OWNER)
  async list(@Query('action') action?: string, @Query('limit') limit?: string) {
    return this.audit.list(action, limit ? Number(limit) : 50);
  }
}
