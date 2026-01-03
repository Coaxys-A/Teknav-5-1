import { Controller, Get, Post, Put, Delete, Param, Query, HttpCode, HttpStatus, UseGuards, Logger, Req } from '@nestjs/common';
import { FunnelsService } from './funnels.service';
import { PoliciesGuard } from '../../security/policies.guard';
import { RequirePolicy } from '../../security/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';
import { z } from 'zod';

@Controller('owner/analytics')
@UseGuards(PoliciesGuard)
export class FunnelsController {
  private readonly logger = new Logger(FunnelsController.name);

  constructor(
    private readonly funnelsService: FunnelsService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  /**
   * Get all funnels
   */
  @Get('funnels')
  @HttpCode(HttpStatus.OK)
  async getFunnels(@Req() req: any) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'FunnelList',
      targetId: 0,
      metadata: {},
    });

    return await this.funnelsService.getFunnels();
  }

  /**
   * Create funnel
   */
  @Post('funnels')
  @HttpCode(HttpStatus.OK)
  async createFunnel(
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Validate with Zod
    const schema = z.object({
      key: z.string().min(1),
      name: z.string().min(1),
      steps: z.array(z.any()),
      conversionWindowMinutes: z.number().min(1).optional(),
      scope: z.enum(['anonymous', 'user', 'both']).optional(),
    });
    const validated = schema.parse(body);

    const result = await this.funnelsService.createFunnel(validated);

    // Log action
    await this.auditLog.logAction({
      actorId,
      action: 'owner.analytics.funnel.create',
      resource: 'Funnel',
      payload: validated,
      ip: req.ip,
      ua: req.ua,
    });

    return result;
  }

  /**
   * Update funnel
   */
  @Put('funnels/:key')
  @HttpCode(HttpStatus.OK)
  async updateFunnel(
    @Param('key') key: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Validate with Zod
    const schema = z.object({
      name: z.string().min(1).optional(),
      steps: z.array(z.any()).optional(),
      conversionWindowMinutes: z.number().min(1).optional(),
      scope: z.enum(['anonymous', 'user', 'both']).optional(),
    }).partial();
    const validated = schema.parse(body);

    const result = await this.funnelsService.updateFunnel(key, validated);

    // Log action
    await this.auditLog.logAction({
      actorId,
      action: 'owner.analytics.funnel.update',
      resource: 'Funnel',
      payload: { key, ...validated },
      ip: req.ip,
      ua: req.ua,
    });

    return result;
  }

  /**
   * Delete funnel
   */
  @Delete('funnels/:key')
  @HttpCode(HttpStatus.OK)
  async deleteFunnel(
    @Param('key') key: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    const result = await this.funnelsService.deleteFunnel(key);

    // Log action
    await this.auditLog.logAction({
      actorId,
      action: 'owner.analytics.funnel.delete',
      resource: 'Funnel',
      payload: { key },
      ip: req.ip,
      ua: req.ua,
    });

    return result;
  }

  /**
   * Get funnel report
   */
  @Get('funnels/:key/report')
  @HttpCode(HttpStatus.OK)
  async getFunnelReport(
    @Param('key') key: string,
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    return await this.funnelsService.getFunnelReport({ key, ...query });
  }
}
  }
}
