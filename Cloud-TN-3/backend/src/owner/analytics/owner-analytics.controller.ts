import { Controller, Get, Query, Param, HttpCode, HttpStatus, UseGuards, Logger, Req } from '@nestjs/common';
import { PoliciesGuard } from '../../security/policies.guard';
import { RequirePolicy } from '../../security/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('owner/analytics')
@UseGuards(PoliciesGuard)
export class OwnerAnalyticsController {
  private readonly logger = new Logger(OwnerAnalyticsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'AnalyticsOverview',
      targetId: 0,
      metadata: query,
    });

    // Parse date range
    const { from = '', to = '' } = query;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Fetch aggregated data from DB
    const articleViews = await this.prisma.articleStatsDaily.aggregate({
      _sum: { views: true },
      where: {
        date: { gte: new Date(fromDate.getFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()), lte: toDate },
      },
    });

    const totalViews = await this.prisma.analyticsAggregate.sum({
      where: {
        bucket: { gte: new Date(fromDate.getFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()), lte: toDate },
      },
      count: true,
    });

    const totalSearches = await this.prisma.searchQueryStatsDaily.sum({
      where: {
        date: { gte: new Date(fromDate.getFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()), lte: toDate },
      },
      count: true,
    });

    const totalClicks = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'click',
        timestamp: { gte: fromDate, lte: toDate },
      },
    });

    const totalDashboardViews = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'dashboard_view',
        timestamp: { gte: fromDate, lte: toDate },
      },
    });

    return {
      data: {
        totalViews: totalViews || 0,
        articleViews: articleViews._sum?.views || 0,
        totalSearches: totalSearches || 0,
        totalClicks: totalClicks.length,
        totalDashboardViews: totalDashboardViews.length,
        from: fromDate,
        to: toDate,
      },
    };
  }

  @Get('articles')
  @HttpCode(HttpStatus.OK)
  async getArticleStats(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'ArticleStatsList',
      targetId: 0,
      metadata: query,
    });

    const { page = 1, pageSize = 20, search = '', from = '', to = '' } = query;
    const skip = (page - 1) * pageSize;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const where: any = {
      date: { gte: new Date(fromDate.getFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()), lte: new Date(toDate.getFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 23, 59, 59, 999) },
    };

    if (search) {
      // Search by article title (simplified - in production join with Article table)
      where.articleTitle = { contains: search, mode: 'insensitive' };
    }

    const [stats, total] = await Promise.all([
      this.prisma.articleStatsDaily.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.articleStatsDaily.count({ where }),
    ]);

    return {
      data: stats,
      count: total,
      page,
      pageSize,
      from: fromDate,
      to: toDate,
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async getSearchStats(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'SearchStatsList',
      targetId: 0,
      metadata: query,
    });

    const { page = 1, pageSize = 20, search = '', from = '', to = '' } = query;
    const skip = (page - 1) * pageSize;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const where: any = {
      date: { gte: new Date(fromDate.getFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()), lte: new Date(toDate.getFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 23, 59, 59, 999) },
    };

    if (search) {
      where.query = { contains: search, mode: 'insensitive' };
    }

    const [stats, total] = await Promise.all([
      this.prisma.searchQueryStatsDaily.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.searchQueryStatsDaily.count({ where }),
    ]);

    return {
      data: stats,
      count: total,
      page,
      pageSize,
      from: fromDate,
      to: toDate,
    };
  }

  @Get('engagement')
  @HttpCode(HttpStatus.OK)
  async getEngagementStats(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'UserEngagementList',
      targetId: 0,
      metadata: query,
    });

    const { page = 1, pageSize = 20, from = '', to = '' } = query;
    const skip = (page - 1) * pageSize;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const where = {
      date: { gte: new Date(fromDate.getFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()), lte: new Date(toDate.getFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 23, 59, 59, 999) },
    };

    const [stats, total] = await Promise.all([
      this.prisma.userEngagementDaily.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.userEngagementDaily.count({ where }),
    ]);

    return {
      data: stats,
      count: total,
      page,
      pageSize,
      from: fromDate,
      to: toDate,
    };
  }

  @Get('realtime')
  @HttpCode(HttpStatus.OK)
  async getRealtimeCounts(
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Note: Realtime counts are maintained in Redis by AnalyticsIngestService
    // This endpoint reads from Redis cache (or DB if cache misses)
    
    // For now, return mock data (in production, read from Redis)
    return {
      data: {
        totalViews: 0,
        totalClicks: 0,
        totalSearches: 0,
        lastUpdated: new Date(),
      },
    };
  }
}
  }

  /**
   * Get traffic referrers
   */
  @Get('traffic/referrers')
  @HttpCode(HttpStatus.OK)
  async getReferrers(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'TrafficReferrers',
      targetId: 0,
      metadata: query,
    });

    const trafficService = new (await import('../analytics/traffic.service')).TrafficService(
      this.prisma,
      this.redis,
      this.authContext,
      this.dataAccessLog,
    );
    
    return await trafficService.getReferrers(query);
  }

  /**
   * Get traffic devices
   */
  @Get('traffic/devices')
  @HttpCode(HttpStatus.OK)
  async getDevices(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'TrafficDevices',
      targetId: 0,
      metadata: query,
    });

    const trafficService = new (await import('../analytics/traffic.service')).TrafficService(
      this.prisma,
      this.redis,
      this.authContext,
      this.dataAccessLog,
    );

    return await trafficService.getDevices(query);
  }

  /**
   * Get traffic UTM
   */
  @Get('traffic/utm')
  @HttpCode(HttpStatus.OK)
  async getUtm(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'TrafficUTM',
      targetId: 0,
      metadata: query,
    });

    const trafficService = new (await import('../analytics/traffic.service')).TrafficService(
      this.prisma,
      this.redis,
      this.authContext,
      this.dataAccessLog,
    );

    return await trafficService.getUtm(query);
  }

  /**
   * Get realtime stream (SSE)
   */
  @Get('realtime/stream')
  @HttpCode(HttpStatus.OK)
  async getRealtimeStream(
    @Req() req: any,
    @Res() res: any,
  ) {
    const actorId = req.user?.id;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const realtimeService = new (await import('../analytics/realtime-analytics.service')).RealtimeAnalyticsService(
      this.redis,
    );

    const generator = realtimeService.subscribeToRealtimeEvents();

    try {
      for await (const event of generator) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      this.logger.error('SSE stream error:', error);
      res.write('event: error\ndata: Stream ended\n\n');
    } finally {
      res.end();
    }
  }
}
