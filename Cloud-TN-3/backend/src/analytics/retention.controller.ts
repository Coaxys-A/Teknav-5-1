import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards, Logger, Req, Res } from '@nestjs/common';
import { RetentionService } from './retention.service';
import { PoliciesGuard } from '../../security/policies.guard';
import { RequirePolicy } from '../../security/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';

@Controller('owner/analytics')
@UseGuards(PoliciesGuard)
export class RetentionController {
  private readonly logger = new Logger(RetentionController.name);

  constructor(
    private readonly retentionService: RetentionService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  @Get('retention/report')
  @HttpCode(HttpStatus.OK)
  async getRetentionReport(
    @Query() query: any,
    @Req() req: any,
  ) {
    return await this.retentionService.getRetentionReport(query);
  }

  @Get('retention/export')
  @HttpCode(HttpStatus.OK)
  async exportRetention(
    @Query() query: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    const result = await this.retentionService.exportRetentionToCSV(query);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }
}
