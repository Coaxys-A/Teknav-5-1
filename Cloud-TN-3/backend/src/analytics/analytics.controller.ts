import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('owner/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analytics.overview();
  }

  @Get('article')
  article() {
    return this.analytics.articleStats();
  }

  @Get('search')
  search() {
    return this.analytics.searchStats();
  }

  @Get('engagement')
  engagement(@Query('limit') limit?: string) {
    return this.analytics.engagementStats(limit ? Number(limit) : 30);
  }

  @Get('funnel')
  funnel(@Query('limit') limit?: string) {
    return this.analytics.funnelSteps(limit ? Number(limit) : 30);
  }

  @Get('retention')
  retention(@Query('limit') limit?: string) {
    return this.analytics.retention(limit ? Number(limit) : 30);
  }

  @Get('crash')
  crash(@Query('limit') limit?: string) {
    return this.analytics.crashLogs(limit ? Number(limit) : 50);
  }
}
