import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, UseGuards, Logger, Req } from '@nestjs/common';
import { QueueMonitorService } from '../../queue/queue-monitor.service';
import { PoliciesGuard } from '../../security/policies.guard';
import { RequirePolicy } from '../../security/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';

@Controller('owner/queues')
@UseGuards(PoliciesGuard)
export class OwnerQueuesController {
  private readonly logger = new Logger(OwnerQueuesController.name);

  constructor(
    private readonly queueMonitor: QueueMonitorService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getQueues(@Req() req: any) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'QueueList',
      targetId: 0,
      metadata: {},
    });

    return await this.queueMonitor.getQueueStats();
  }

  @Get(':name/jobs')
  @HttpCode(HttpStatus.OK)
  async getJobs(
    @Param('name') name: string,
    @Query() query: any,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'QueueJobs',
      targetId: 0,
      metadata: { queueName: name, query },
    });

    return await this.queueMonitor.getJobs(name, query);
  }

  @Get(':name/jobs/:id')
  @HttpCode(HttpStatus.OK)
  async getJob(
    @Param('name') name: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    // Log sensitive read
    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'QueueJob',
      targetId: id,
      metadata: { queueName: name },
    });

    return await this.queueMonitor.getJob(name, id);
  }

  @Post(':name/jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  async retryJob(
    @Param('name') name: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    const result = await this.queueMonitor.retryJob(name, id);

    // Log action
    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.job.retry',
      resource: 'QueueJob',
      payload: { queueName: name, jobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    return result;
  }

  @Post('dlq/:id/replay')
  @HttpCode(HttpStatus.OK)
  async replayDLQJob(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    const result = await this.queueMonitor.replayDLQJob(id);

    // Log action
    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.replay',
      resource: 'DLQJob',
      payload: { dlqJobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    return result;
  }

  @Post('dlq/:id/delete')
  @HttpCode(HttpStatus.OK)
  async deleteDLQJob(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    const result = await this.queueMonitor.deleteDLQJob(id);

    // Log action
    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.delete',
      resource: 'DLQJob',
      payload: { dlqJobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    return result;
  }
}
