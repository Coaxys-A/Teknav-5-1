import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('logging')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoggingController {
  constructor(private readonly logging: LoggingService) {}

  @Get('latest')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  latest(@Query('type') type = 'audit', @Query('limit') limit?: string) {
    return this.logging.latest(type as any, limit ? Number(limit) : 50);
  }

  @Get('aggregates')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  aggregates() {
    return this.logging.aggregates();
  }
}
