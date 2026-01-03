import { Controller, Get, Post, Delete, Param, Query, HttpCode, HttpStatus, UseGuards, Logger, Req, Body } from '@nestjs/common';
import { DlqService } from './dlq.service';
import { PoliciesGuard } from '../../auth/policy/policies.guard';
import { RequirePolicy } from '../../auth/policy/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';
import { Action, Resource } from '../../auth/policy/policy.service';
import { RedisService } from '../../redis/redis.service';

/**
 * Enhanced DLQ Controller
 *
 * Provides endpoints for:
 * - DLQ job listing (with search and filtering)
 * - DLQ job replay, delete
 * - DLQ clearing
 * - DLQ analytics (failure patterns, trends)
 * - DLQ export
 * - DLQ bulk operations
 */

@Controller('owner/dlq')
@UseGuards(PoliciesGuard)
export class DlqController {
  private readonly logger = new Logger(DlqController.name);

  constructor(
    private readonly dlqService: DlqService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
    private readonly redis: RedisService,
  ) {}

  // ==========================================================================
  // DLQ JOB LISTING
  // ==========================================================================

  @Get()
  @RequirePolicy(Action.READ, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getDLQJobs(
    @Query() query: { page?: number; pageSize?: number; search?: string; originalQueue?: string; minReplayCount?: number },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;

    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read_sensitive',
      targetType: 'DLQ',
      targetId: 0,
      metadata: query,
    });

    const { page = 1, pageSize = 20, search, originalQueue, minReplayCount } = query;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    let jobs = await this.dlqService.getDLQJobs(start, end);

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter((job: any) =>
        job.id?.toLowerCase().includes(searchLower) ||
        job.data?.originalQueue?.toLowerCase().includes(searchLower) ||
        job.data?.originalJobId?.toLowerCase().includes(searchLower) ||
        job.data?.error?.message?.toLowerCase().includes(searchLower) ||
        JSON.stringify(job.data?.payload)?.toLowerCase().includes(searchLower)
      );
    }

    if (originalQueue) {
      jobs = jobs.filter((job: any) => job.data?.originalQueue === originalQueue);
    }

    if (minReplayCount) {
      jobs = jobs.filter((job: any) => job.data?.replayCount >= minReplayCount);
    }

    return {
      data: jobs.map((job: any) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
      })),
      page,
      pageSize,
      total: jobs.length,
    };
  }

  // ==========================================================================
  // DLQ ANALYTICS
  // ==========================================================================

  @Get('analytics')
  @RequirePolicy(Action.READ, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getDLQAnalytics(@Req() req: any) {
    const actorId = req.user?.id;

    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read',
      targetType: 'DLQAnalytics',
      targetId: 0,
      metadata: {},
    });

    // Get all DLQ jobs for analysis
    const allJobs = await this.dlqService.getDLQJobs(0, 1000);

    // Analyze patterns
    const failuresByQueue = new Map<string, number>();
    const failuresByJobName = new Map<string, number>();
    const failuresByReason = new Map<string, number>();
    const failuresByHour = new Map<string, number>();
    const replayedByJob = new Map<string, number>();
    const neverReplayedCount = allJobs.filter((j: any) => !j.data?.isReplayed).length;
    const replayedCount = allJobs.filter((j: any) => j.data?.isReplayed).length;
    const highReplayCount = allJobs.filter((j: any) => j.data?.replayCount >= 3).length;

    allJobs.forEach((job: any) => {
      const data = job.data;

      // Count by original queue
      const queue = data.originalQueue || 'unknown';
      failuresByQueue.set(queue, (failuresByQueue.get(queue) || 0) + 1);

      // Count by original job name
      const jobName = data.originalJobName || 'unknown';
      failuresByJobName.set(jobName, (failuresByJobName.get(jobName) || 0) + 1);

      // Count by error reason
      const reason = data.error?.message || 'unknown';
      failuresByReason.set(reason, (failuresByReason.get(reason) || 0) + 1);

      // Count by hour
      const hour = new Date(data.firstFailedAt).toISOString().slice(0, 13);
      failuresByHour.set(hour, (failuresByHour.get(hour) || 0) + 1);

      // Count replays by job
      if (data.isReplayed) {
        replayedByJob.set(data.originalJobId, (replayedByJob.get(data.originalJobId) || 0) + 1);
      }
    });

    // Get top failures
    const topFailuresByQueue = this.getTopEntries(failuresByQueue, 10);
    const topFailuresByJobName = this.getTopEntries(failuresByJobName, 10);
    const topFailuresByReason = this.getTopEntries(failuresByReason, 10);
    const topFailuresByHour = this.getTopEntries(failuresByHour, 24);
    const topReplayedJobs = this.getTopEntries(replayedByJob, 10);

    return {
      data: {
        total: allJobs.length,
        neverReplayed: neverReplayedCount,
        replayed: replayedCount,
        highReplayCount,
        byQueue: topFailuresByQueue,
        byJobName: topFailuresByJobName,
        byReason: topFailuresByReason,
        byHour: topFailuresByHour,
        topReplayedJobs,
      },
    };
  }

  @Get('trends')
  @RequirePolicy(Action.READ, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getDLQTrends(@Query() query: { hours?: number; queueName?: string }) {
    const { hours = 24, queueName } = query;

    // Get jobs from last N hours
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const allJobs = await this.dlqService.getDLQJobs(0, 5000);

    const trendData = allJobs
      .filter((job: any) => {
        const firstFailedAt = new Date(job.data?.firstFailedAt);
        return firstFailedAt >= cutoffTime;
      })
      .filter((job: any) => !queueName || job.data?.originalQueue === queueName)
      .map((job: any) => {
        const hour = new Date(job.data?.firstFailedAt).toISOString().slice(0, 13);
        return {
          hour,
          queue: job.data?.originalQueue,
          jobName: job.data?.originalJobName,
          reason: job.data?.error?.message,
        };
      });

    // Group by hour
    const trendsByHour = new Map<string, number>();
    trendData.forEach((item) => {
      trendsByHour.set(item.hour, (trendsByHour.get(item.hour) || 0) + 1);
    });

    return {
      data: {
        hours,
        totalInPeriod: trendData.length,
        trends: Object.fromEntries(trendsByHour),
      },
    };
  }

  // ==========================================================================
  // DLQ EXPORT
  // ==========================================================================

  @Get('export')
  @RequirePolicy(Action.READ, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async exportDLQ(@Req() req: any, @Res() res: any) {
    const actorId = req.user?.id;

    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'export',
      targetType: 'DLQ',
      targetId: 0,
      metadata: {},
    });

    const allJobs = await this.dlqService.getDLQJobs(0, 10000);

    // Format as CSV
    const csv = [
      ['Job ID', 'Original Queue', 'Original Job ID', 'Original Job Name', 'Error Message', 'First Failed At', 'Last Failed At', 'Replay Count', 'Payload'].join(','),
      ...allJobs.map((job: any) => [
        job.id,
        job.data?.originalQueue,
        job.data?.originalJobId,
        job.data?.originalJobName,
        `"${(job.data?.error?.message || '').replace(/"/g, '""')}"`,
        job.data?.firstFailedAt,
        job.data?.lastFailedAt,
        job.data?.replayCount,
        `"${JSON.stringify(job.data?.payload || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ].join(',')),
    ].join('\n');

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=dlq_export_${Date.now()}.csv`);
    res.send(csv);

    await this.auditLog.logAction({
      actorId,
      action: 'owner.dlq.export',
      resource: 'DLQ',
      payload: { count: allJobs.length },
      ip: req.ip,
      ua: req.ua,
    });
  }

  // ==========================================================================
  // DLQ JOB OPERATIONS
  // ==========================================================================

  @Get(':id')
  @RequirePolicy(Action.READ, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async getDLQJob(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id;

    await this.dataAccessLog.logAccess({
      actorUserId: actorId,
      action: 'read',
      targetType: 'DLQJob',
      targetId: id,
      metadata: {},
    });

    const dlqQueue = this.dlqService.getDLQQueue();
    const job = await dlqQueue.getJob(id);

    if (!job) {
      return {
        error: 'DLQ Job not found',
      };
    }

    return {
      data: {
        id: job.id,
        name: job.name,
        data: job.data,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
      },
    };
  }

  @Post(':id/replay')
  @RequirePolicy(Action.MANAGE, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async replayJob(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id;

    const result = await this.dlqService.replayJob(id);

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.replay',
      resource: 'DLQJob',
      payload: { dlqJobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: result };
  }

  @Post(':id/delete')
  @RequirePolicy(Action.DELETE, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async deleteJob(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id;

    const result = await this.dlqService.deleteJob(id);

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.delete',
      resource: 'DLQJob',
      payload: { dlqJobId: id },
      ip: req.ip,
      ua: req.ua,
    });

    return { data: result };
  }

  // ==========================================================================
  // DLQ BULK OPERATIONS
  // ==========================================================================

  @Post('bulk-replay')
  @RequirePolicy(Action.MANAGE, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async bulkReplayJobs(
    @Body() body: { jobIds: string[]; force?: boolean },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    const { jobIds, force = false } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return {
        error: 'Invalid jobIds array',
      };
    }

    const results = await Promise.all(
      jobIds.map(async (jobId) => {
        try {
          const result = await this.dlqService.replayJob(jobId);
          return { jobId, success: true, ...result };
        } catch (error: any) {
          return { jobId, success: false, error: error.message };
        }
      }),
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.bulk_replay',
      resource: 'DLQJob',
      payload: { jobIds, results, successCount, failureCount },
      ip: req.ip,
      ua: req.ua,
    });

    return {
      data: {
        message: `Processed ${results.length} DLQ jobs`,
        successCount,
        failureCount,
        results,
      },
    };
  }

  @Post('bulk-delete')
  @RequirePolicy(Action.DELETE, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async bulkDeleteJobs(@Body() body: { jobIds: string[] }) {
    const actorId = req.user?.id;
    const { jobIds } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return {
        error: 'Invalid jobIds array',
      };
    }

    const results = await Promise.all(
      jobIds.map(async (jobId) => {
        try {
          const result = await this.dlqService.deleteJob(jobId);
          return { jobId, success: true, ...result };
        } catch (error: any) {
          return { jobId, success: false, error: error.message };
        }
      }),
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.bulk_delete',
      resource: 'DLQJob',
      payload: { jobIds, results, successCount, failureCount },
      ip: req.ip,
      ua: req.ua,
    });

    return {
      data: {
        message: `Processed ${results.length} DLQ jobs`,
        successCount,
        failureCount,
        results,
      },
    };
  }

  // ==========================================================================
  // DLQ CLEAR
  // ==========================================================================

  @Post('clear')
  @RequirePolicy(Action.DELETE, Resource.QUEUE)
  @HttpCode(HttpStatus.OK)
  async clearDLQ(
    @Body() body: { confirmToken?: string; filter?: { originalQueue?: string; minReplayCount?: number } },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    const { confirmToken, filter } = body;

    // Double confirm for clear DLQ
    if (!confirmToken || confirmToken !== 'CONFIRM_CLEAR_DLQ') {
      return {
        error: 'Confirmation token required',
        message: 'Please provide confirmToken: "CONFIRM_CLEAR_DLQ" to confirm this destructive action',
      };
    }

    // If filter provided, only clear matching jobs
    if (filter) {
      const allJobs = await this.dlqService.getDLQJobs(0, 10000);
      let jobsToDelete = allJobs;

      if (filter.originalQueue) {
        jobsToDelete = jobsToDelete.filter((j: any) => j.data?.originalQueue === filter.originalQueue);
      }

      if (filter.minReplayCount) {
        jobsToDelete = jobsToDelete.filter((j: any) => j.data?.replayCount >= filter.minReplayCount);
      }

      const jobIds = jobsToDelete.map((j: any) => j.id);
      const results = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            await this.dlqService.deleteJob(jobId);
            return { jobId, success: true };
          } catch (error: any) {
            return { jobId, success: false, error: error.message };
          }
        }),
      );

      await this.auditLog.logAction({
        actorId,
        action: 'owner.queue.dlq.clear_filtered',
        resource: 'DLQ',
        payload: { filter, results },
        ip: req.ip,
        ua: req.ua,
      });

      return {
        data: { message: `Cleared ${results.length} DLQ jobs matching filter`, filter, results },
      };
    }

    // Clear all
    await this.dlqService.clearDLQ();

    await this.auditLog.logAction({
      actorId,
      action: 'owner.queue.dlq.cleared',
      resource: 'DLQ',
      payload: {},
      ip: req.ip,
      ua: req.ua,
    });

    return {
      data: { message: 'DLQ cleared successfully' },
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private getTopEntries(map: Map<string, number>, limit: number): Array<{ key: string; value: number }> {
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }
}
