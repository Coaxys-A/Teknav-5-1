import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SponsorsService } from './sponsors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('sponsors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SponsorsController {
  constructor(private readonly sponsors: SponsorsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  async createSponsor(@Body() body: { workspaceId: number; name: string; url?: string; logo?: string; contact?: string; notes?: string }) {
    return this.sponsors.createSponsor(body.workspaceId, body);
  }

  @Get()
  async list(@Query('workspaceId') workspaceId: string) {
    return this.sponsors.listSponsors(Number(workspaceId));
  }

  @Post('campaigns')
  @Roles(Role.ADMIN, Role.OWNER)
  async createCampaign(
    @Body()
    body: { workspaceId: number; sponsorId: number; name: string; startDate?: Date; endDate?: Date; budget?: number; pricingModel?: string; targeting?: any },
  ) {
    return this.sponsors.createCampaign(body.workspaceId, body);
  }

  @Get('campaigns')
  async campaigns(@Query('workspaceId') workspaceId: string) {
    return this.sponsors.listCampaigns(Number(workspaceId));
  }

  @Post('placements')
  @Roles(Role.ADMIN, Role.OWNER)
  async placement(@Body() body: { workspaceId: number; campaignId: number; placementType: string; position?: string; conditions?: any }) {
    return this.sponsors.createPlacement(body.workspaceId, body);
  }

  @Get('placements')
  async listPlacements(@Query('workspaceId') workspaceId: string) {
    return this.sponsors.placements(Number(workspaceId));
  }
}
