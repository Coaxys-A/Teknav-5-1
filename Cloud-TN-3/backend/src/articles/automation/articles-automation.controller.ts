import { Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Logger, Req, Param, Body, Query } from '@nestjs/common';
import { ArticlesAutomationService } from './articles-automation.service';
import { PoliciesGuard } from '../../../auth/policy/policies.guard';
import { RequirePolicy } from '../../../auth/policy/policy.decorator';
import { AuditLogService } from '../../../logging/audit-log.service';
import { DataAccessLogService } from '../../../logging/data-access-log.service';
import { Action, Resource } from '../../../auth/policy/policy.service';

@Controller('owner/articles')
@UseGuards(PoliciesGuard)
export class ArticlesAutomationController {
  private readonly logger = new Logger(ArticlesAutomationController.name);

  constructor(
    private readonly articlesAutomationService: ArticlesAutomationService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  @Post('submit-for-review')
  @RequirePolicy(Action.UPDATE, Resource.ARTICLE)
  @HttpCode(HttpStatus.OK)
  async submitForReview(
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return await this.articlesAutomationService.submitForReview({ ...body, submitterId: actorId });
  }

  @Post('approve')
  @RequirePolicy(Action.APPROVE, Resource.ARTICLE)
  @HttpCode(HttpStatus.OK)
  async approve(
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return await this.articlesAutomationService.approve({ ...body, approverId: actorId });
  }

  @Post('reject')
  @RequirePolicy(Action.APPROVE, Resource.ARTICLE)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return await this.articlesAutomationService.reject({ ...body, rejecterId: actorId });
  }

  @Post('publish-now')
  @RequirePolicy(Action.PUBLISH, Resource.ARTICLE)
  @HttpCode(HttpStatus.OK)
  async publishNow(
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return await this.articlesAutomationService.publishNow({ ...body, publisherId: actorId });
  }

  @Post('schedule-publish')
  @RequirePolicy(Action.PUBLISH, Resource.ARTICLE)
  @HttpCode(HttpStatus.OK)
  async schedulePublish(
    @Body() body: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return await this.articlesAutomationService.schedulePublish({ ...body, schedulerId: actorId });
  }

  @Get(':id/audit-trail')
  @RequirePolicy(Action.READ, Resource.ARTICLE)
  @HttpCode(HttpStatus.OK)
  async getAuditTrail(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return await this.articlesAutomationService.getAuditTrail(parseInt(id));
  }
}
