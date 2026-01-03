import { Controller, Get, HttpCode, HttpStatus, UseGuards, Logger, Req, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { PoliciesGuard } from '../auth/policy/policies.guard';
import { AuditLogService } from '../logging/audit-log.service';
import { DataAccessLogService } from '../logging/data-access-log.service';

/**
 * Search Controller
 */

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    const result = await this.searchService.search(query);

    return result;
  }
}
