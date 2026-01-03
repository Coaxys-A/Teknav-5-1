import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
export class StatsController {
  constructor(private readonly aggregation: AggregationService) {}

  @Post('aggregate/daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async aggregate() {
    return this.aggregation.aggregateDaily();
  }

  @Get('articles/:id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR, Role.AUTHOR, Role.WRITER, Role.CREATOR, Role.PUBLISHER)
  async articleStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.aggregation.getArticleStats(id, fromDate, toDate);
  }
}
