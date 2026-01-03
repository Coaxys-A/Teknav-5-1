import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('distribution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DistributionController {
  constructor(private readonly dist: DistributionService) {}

  @Get('channels')
  @Roles(Role.ADMIN, Role.OWNER)
  async list() {
    return this.dist.listChannels();
  }

  @Post('channels')
  @Roles(Role.ADMIN, Role.OWNER)
  async create(@Body() body: { type: string; name: string; config?: Record<string, any>; isActive?: boolean }) {
    return this.dist.registerChannel(body);
  }

  @Post('channels/:id')
  @Roles(Role.ADMIN, Role.OWNER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { type?: string; name?: string; config?: Record<string, any>; isActive?: boolean },
  ) {
    return this.dist.updateChannel(id, body);
  }
}
