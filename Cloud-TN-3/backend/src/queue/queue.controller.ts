import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { BullQueueService } from './bullmq.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {
  constructor(private readonly bull: BullQueueService) {}

  @Get(':name/metrics')
  @Roles(Role.OWNER)
  metrics(@Param('name') name: string) {
    return this.bull.metrics(name);
  }

  @Get(':name/failed')
  @Roles(Role.OWNER)
  failed(@Param('name') name: string, @Query('limit') limit?: string) {
    return this.bull.failed(name, limit ? Number(limit) : 20);
  }

  @Post(':name/failed/:id/retry')
  @Roles(Role.OWNER)
  retry(@Param('name') name: string, @Param('id') id: string) {
    return this.bull.retry(name, id);
  }

  @Post(':name/dlq/requeue')
  @Roles(Role.OWNER)
  requeue(@Param('name') name: string, @Query('limit') limit?: string) {
    return this.bull.requeueFromDlq(name, limit ? Number(limit) : 20);
  }

  @Get(':name/health')
  @Roles(Role.OWNER)
  health(@Param('name') name: string) {
    return this.bull.health(name);
  }

  @Get('health/all')
  @Roles(Role.OWNER)
  healthAll() {
    return this.bull.health();
  }
}
