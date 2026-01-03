import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus, UseGuards, Logger, Req } from '@nestjs/common';
import { OwnerQueuesService } from './owner-queues.service';
import { PoliciesGuard } from '../../auth/policies.guard';
import { RequirePolicy } from '../../security/policy/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { PolicyAction, PolicyResource } from '../../security/policy/policy.types';

/**
 * Owner Queues Controller
 *
 * Endpoints for:
 * - Queue list (stats + actions)
 * - Queue detail (tabs: Jobs, Failed, DLQ, Metrics)
 * - Job detail (payload, attempts, stack trace, timeline, replay/remove)
 * - DLQ page (replay single/batch, purge, inspect)
 */

@Controller('owner/queues')
@UseGuards(PoliciesGuard)
export class OwnerQueuesController {
  private readonly logger = new Logger(OwnerQueuesController.name);

  constructor(
    private readonly ownerQueues: OwnerQueuesService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ==========================================================================
  // QUEUE LIST
  // ==========================================================================

  @Get('')
  @RequirePolicy(PolicyAction.READ, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async listQueues(
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    const queues = await this.ownerQueues.listQueues();

    await this.auditLog.logAccess({
      actorUserId: actorId,
      action: 'read',
      targetType: 'QueueList',
      targetId: 0,
      metadata: {},
    });

    return { data: queues };
  }

  // ==========================================================================
  // QUEUE CONTROL
  // ==========================================================================

  @Post(':queue/pause')
  @RequirePolicy(PolicyAction.CONFIGURE, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async pauseQueue(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    await this.ownerQueues.pauseQueue(queue, actorId);

    return { message: 'Queue paused', queue };
  }

  @Post(':queue/resume')
  @RequirePolicy(PolicyAction.CONFIGURE, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async resumeQueue(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    await this.ownerQueues.resumeQueue(queue, actorId);

    return { message: 'Queue resumed', queue };
  }

  @Post(':queue/purge')
  @RequirePolicy(PolicyAction.DELETE, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async purgeQueue(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    await this.ownerQueues.purgeQueue(queue, actorId);

    return { message: 'Queue purged', queue };
  }

  // ==========================================================================
  // QUEUE DETAIL (JOBS)
  // ==========================================================================

  @Get(':queue/jobs')
  @RequirePolicy(PolicyAction.READ, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getJobs(
    @Param('queue') queue: string,
    @Query() query: {
      state?: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
      start?: number;
      end?: number;
    },
    @Req() req: any,
  ) {
    const actorId = req.user.id;
    const { state = 'waiting', start = 0, end = 50 } = query;

    const result = await this.ownerQueues.getJobs(queue, state, start, end);

    return result;
  }

  // ==========================================================================
  // JOB DETAIL
  // ==========================================================================

  @Get(':queue/jobs/:jobId')
  @RequirePolicy(PolicyAction.READ, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getJob(
    @Param('queue') queue: string,
    @Param('jobId') jobId: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    const job = await this.ownerQueues.getJob(queue, jobId);

    if (!job) {
      return { error: 'Job not found' };
    }

    return { data: job };
  }

  @Post(':queue/jobs/:jobId/retry')
  @RequirePolicy(PolicyAction.REPLAY, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async retryJob(
    @Param('queue') queue: string,
    @Param('jobId') jobId: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    await this.ownerQueues.retryJob(queue, jobId, actorId);

    return { message: 'Job retried', queue, jobId };
  }

  @Post(':queue/jobs/:jobId/remove')
  @RequirePolicy(PolicyAction.DELETE, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async removeJob(
    @Param('queue') queue: string,
    @Param('jobId') jobId: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    await this.ownerQueues.removeJob(queue, jobId, actorId);

    return { message: 'Job removed', queue, jobId };
  }

  // ==========================================================================
  // DLQ
  // ==========================================================================

  @Get(':queue/dlq')
  @RequirePolicy(PolicyAction.READ, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getDLQJobs(
    @Param('queue') queue: string,
    @Query() query: {
      page?: number;
      pageSize?: number;
      startTime?: string;
      endTime?: string;
      errorType?: string;
      jobId?: string;
    },
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    const {
      page = 1,
      pageSize = 20,
      startTime,
      endTime,
      errorType,
      jobId,
    } = query;

    const filters: any = { page, pageSize };

    if (startTime) filters.startTime = new Date(startTime);
    if (endTime) filters.endTime = new Date(endTime);
    if (errorType) filters.errorType = errorType;
    if (jobId) filters.jobId = jobId;

    const result = await this.ownerQueues.getDLQJobs(queue, filters);

    return result;
  }

  @Get(':queue/dlq/search')
  @RequirePolicy(PolicyAction.READ, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async searchDLQJobs(
    @Param('queue') queue: string,
    @Query() query: { q: string; page?: number; pageSize?: number; },
    @Req() req: any,
  ) {
    const actorId = req.user.id;
    const { q, page = 1, pageSize = 20 } = query;

    const result = await this.ownerQueues.searchDLQJobs(queue, q, page, pageSize);

    return result;
  }

  @Post(':queue/dlq/replay')
  @RequirePolicy(PolicyAction.REPLAY, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async replayDLQJob(
    @Param('queue') queue: string,
    @Body() body: { dlqJobId: string },
    @Req() req: any,
  ) {
    const actorId = req.user.id;
    const { dlqJobId } = body;

    await this.ownerQueues.replayDLQJob(queue, dlqJobId, actorId);

    return { message: 'DLQ job replayed', queue, dlqJobId };
  }

  @Post(':queue/dlq/replay-batch')
  @RequirePolicy(PolicyAction.REPLAY, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async replayDLQBatch(
    @Param('queue') queue: string,
    @Body() body: { dlqJobIds: string[] },
    @Req() req: any,
  ) {
    const actorId = req.user.id;
    const { dlqJobIds } = body;

    const result = await this.ownerQueues.replayDLQBatch(queue, dlqJobIds, actorId);

    return { message: 'DLQ batch replayed', queue, result };
  }

  @Post(':queue/dlq/purge')
  @RequirePolicy(PolicyAction.DELETE, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async purgeDLQ(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user.id;

    const count = await this.ownerQueues.purgeDLQ(queue, actorId);

    return { message: 'DLQ purged', queue, count };
  }

  @Post(':queue/dlq/delete')
  @RequirePolicy(PolicyAction.DELETE, PolicyResource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async deleteDLQJob(
    @Param('queue') queue: string,
    @Body() body: { dlqJobId: string },
    @Req() req: any,
  ) {
    const actorId = req.user.id;
    const { dlqJobId } = body;

    await this.ownerQueues.deleteDLQJob(queue, dlqJobId, actorId);

    return { message: 'DLQ job deleted', queue, dlqJobId };
  }
}
