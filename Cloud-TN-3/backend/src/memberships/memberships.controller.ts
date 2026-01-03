import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Post('plans')
  @Roles(Role.ADMIN, Role.OWNER)
  async createPlan(
    @Body() body: { workspaceId: number; name: string; slug: string; price: number; billingCycle?: string; currency?: string; benefits?: any },
  ) {
    return this.memberships.createPlan(body.workspaceId, body);
  }

  @Get('plans')
  async listPlans(@Query('workspaceId') workspaceId: string) {
    return this.memberships.listPlans(Number(workspaceId));
  }

  @Get('members')
  async members(@Query('workspaceId') workspaceId: string) {
    return this.memberships.listMembers(Number(workspaceId));
  }
}
