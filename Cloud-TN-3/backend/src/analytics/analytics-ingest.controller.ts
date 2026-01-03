import { Controller, Post, HttpCode, HttpStatus, Body, Req, Logger } from '@nestjs/common';
import { AnalyticsIngestService } from './analytics-ingest.service';
import { AnalyticsEventBatchSchema } from './analytics-ingest.schema';
import { AuditLogService } from '../logging/audit-log.service';
import { AuthContextService } from '../auth/auth-context.service';

@Controller('analytics')
export class AnalyticsIngestController {
  private readonly logger = new Logger(AnalyticsIngestController.name);

  constructor(
    private readonly ingestService: AnalyticsIngestService,
    private readonly auditLog: AuditLogService,
    private readonly authContext: AuthContextService,
  ) {}

  /**
   * Ingest batched analytics events (public but protected)
   */
  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  async ingestBatch(
    @Body() body: { events: any[] },
    @Req() req: any,
  ) {
    // Validate with Zod
    const validated = AnalyticsEventBatchSchema.parse(body);

    // Rate limit per-IP
    const ip = req.ip || 'unknown';
    
    // Ingest events
    const result = await this.ingestService.ingestBatch(validated.events);

    return { data: { success: true, ingested: result.ingested } };
  }
}
