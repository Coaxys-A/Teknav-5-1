import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sponsorships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SponsorshipsController {
  constructor(private readonly sponsorships: SponsorshipsService) {}

  @Post(':articleId')
  @Roles(Role.ADMIN, Role.OWNER)
  async assign(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() body: { sponsor: string; sponsorUrl?: string; logoUrl?: string; label?: string; startAt: string; endAt: string },
    @CurrentUser() user: any,
  ) {
    return this.sponsorships.assign(
      articleId,
      {
        name: body.sponsor,
        url: body.sponsorUrl,
        logoUrl: body.logoUrl,
        label: body.label,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
      },
      user?.id,
    );
  }

  @Get(':articleId')
  async getForArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.sponsorships.forArticle(articleId);
  }
}
