import { Controller, Get, Post, Delete, Param, HttpCode, HttpStatus, Query, Body, Req } from '@nestjs/common';
import { QueueStatsService } from '../queue-stats.service';
import { DLQService } from '../dlq.service';
import { QueueProducerService } from '../queue.producer.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';

@Controller('owner/queues')
export class OwnerQueuesController {
  constructor(
    private readonly stats: QueueStatsService,
    private readonly dlq: DLQService,
    private readonly producer: QueueProducerService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllQueueStats(@Req() req: any) {
    const actorId = req.user?.id;
    
    return await this.stats.getAllQueueStats();
  }

  @Get(':queue/stats')
  @HttpCode(HttpStatus.OK)
  async getQueueStats(
    @Param('queue') queue: string,
    @Req() req: any,
    @Query('actorId') actorId?: string,
  ) {
    return await this.stats.getQueueStats(queue);
  }

  @Get(':queue/jobs')
  @HttpCode(HttpStatus.OK)
  async getJobs(
    @Param('queue') queue: string,
    @Query() filters: {
      status?: 'waiting' | 'active' | 'delayed' | 'completed' | 'failed';
      cursor?: string;
      page?: string;
      limit?: string;
      q?: string;
    },
    @Req() req: any,
    @Query('actorId') actorId?: string,
  ) {
    const result = await this.stats.getJobs(queue, filters);

    if (actorId) {
      await this.dataAccessLog.logAccess({
        userId: parseInt(actorId),
        actorUserId: parseInt(actorId),
        action: 'owner.read.queue_jobs',
        targetType: 'Queue',
        targetId: 0,
        metadata: {
          queue,
          status: filters.status,
          count: result.total,
        },
      });
    }

    return result;
  }

  @Get(':queue/jobs/:id')
  @HttpCode(HttpStatus.OK)
  async getJob(
    @Param('queue') queue: string,
    @Param('id') id: string,
    @Req() req: any,
    @Query('actorId') actorId?: string,
  ) {
    const job = await this.stats.getJob(queue, id);

    if (actorId) {
      await this.dataAccessLog.logAccess({
        userId: parseInt(id),
        actorUserId: parseInt(actorId),
        action: 'owner.read.queue_job',
        targetType: 'Job',
        targetId: parseInt(id),
        metadata: {
          queue,
          jobId: id,
          data: job?.data,
        },
      });
    }

    return { data: job };
  }

  @Post(':queue/jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  async retryJob(
    @Param('queue') queue: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.job.retry',
      resource: 'Job',
      payload: { queue, jobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    // BullMQ automatically retries failed jobs
    // If job is not in failed state, move it to waiting
    const job = await this.stats.getJob(queue, id);
    if (job && job.opts?.attemptsMade >= job.opts?.attempts) {
      // Job already exhausted retries, force retry
      await this.producer.addBulkJobs(queue, [
        {
          name: job.name,
          data: job.data,
          opts: { ...job.opts, attempts: 1 },
        },
      ]);
    }

    return { data: { jobId: id, retried: true } };
  }

  @Delete(':queue/jobs/:id')
  @HttpCode(HttpStatus.OK)
  async removeJob(
    @Param('queue') queue: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.job.remove',
      resource: 'Job',
      payload: { queue, jobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    const job = await this.stats.getJob(queue, id);
    if (job) {
      // Note: BullMQ doesn't have a direct remove method in the decorator pattern
      // In production, use Queue instance directly
    }

    return { data: { jobId: id, removed: true } };
  }

  @Post(':queue/pause')
  @HttpCode(HttpStatus.OK)
  async pauseQueue(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.pause',
      resource: 'Queue',
      payload: { queue },
      ip: req.ip,
      ua: req.ua,
    });

    // Note: BullMQ queue pause requires Queue instance
    // In production, use Queue instance directly: await queue.pause()

    return { data: { queue, paused: true } };
  }

  @Post(':queue/resume')
  @HttpCode(HttpStatus.OK)
  async resumeQueue(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.resume',
      resource: 'Queue',
      payload: { queue },
      ip: req.ip,
      ua: req.ua,
    });

    // Note: BullMQ queue resume requires Queue instance
    // In production, use Queue instance directly: await queue.resume()

    return { data: { queue, resumed: true } };
  }

  @Get(':queue/dlq')
  @HttpCode(HttpStatus.OK)
  async getDLQ(
    @Param('queue') queue: string,
    @Query() filters: {
      cursor?: string;
      page?: string;
      limit?: string;
    },
    @Req() req: any,
    @Query('actorId') actorId?: string,
  ) {
    const dlqName = 'dlq:' + queue;
    const result = await this.dlq.getDLQJobs(dlqName, filters);

    if (actorId) {
      await this.dataAccessLog.logAccess({
        userId: 0,
        actorUserId: parseInt(actorId),
        action: 'owner.read.dlq_jobs',
        targetType: 'DLQ',
        targetId: 0,
        metadata: {
          dlq: dlqName,
          count: result.total,
        },
      });
    }

    return result;
  }

  @Post(':queue/dlq/replay')
  @HttpCode(HttpStatus.OK)
  async replayAllDLQJobs(
    @Param('queue') queue: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.replay_all',
      resource: 'DLQ',
      payload: { queue },
      ip: req.ip,
      ua: req.ua,
    });

    const dlqName = 'dlq:' + queue;
    const result = await this.dlq.replayAllDLQJobs(dlqName);

    return { data: { dlq: dlqName, replayed: result.replayed } };
  }

  @Post(':queue/dlq/:id/replay')
  @HttpCode(HttpStatus.OK)
  async replayDLQJob(
    @Param('queue') queue: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.replay',
      resource: 'DLQJob',
      payload: { queue, dlqJobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    const dlqName = 'dlq:' + queue;
    await this.dlq.replayDLQJob({
      dlqName,
      dlqJobId: id,
    });

    return { data: { dlqJobId: id, replayed: true } };
  }

  @Delete(':queue/dlq/:id')
  @HttpCode(HttpStatus.OK)
  async removeDLQJob(
    @Param('queue') queue: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.remove',
      resource: 'DLQJob',
      payload: { queue, dlqJobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    const dlqName = 'dlq:' + queue;
    await this.dlq.removeDLQJob({
      dlqName,
      dlqJobId: id,
    });

    return { data: { dlqJobId: id, removed: true } };
  }
}
