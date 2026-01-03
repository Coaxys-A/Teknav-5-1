import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';

@Processor('plugins:execute')
export class PluginProcessor {
  private readonly logger = new Logger(PluginProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly dlq: DlqService,
    private readonly metrics: QueueMetricsService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
    this.metrics.publishJobEvent('plugins:execute', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('plugins:execute', job.id!, 'failed', { error: error.message });

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('execute-plugin')
  async handleExecutePlugin(job: Job) {
    this.logger.log(`Processing execute-plugin job ${job.id}`);

    const schema = z.object({
      pluginId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
      input: z.any(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Get Plugin
      const plugin = await this.prisma.plugin.findUnique({
        where: { id: data.pluginId },
      });

      if (!plugin) {
        throw new Error(`Plugin ${data.pluginId} not found`);
      }

      // 2. Create PluginExecutionLog
      const log = await this.prisma.pluginExecutionLog.create({
        data: {
          pluginId: data.pluginId,
          userId: data.userId,
          tenantId: data.tenantId,
          status: 'in_progress',
          input: data.input,
        },
      });

      // 3. Execute Plugin (WASM sandbox - mock for now)
      const result = await this.executePlugin(plugin, data.input);

      // 4. Update PluginExecutionLog
      await this.prisma.pluginExecutionLog.update({
        where: { id: log.id },
        data: {
          status: 'completed',
          output: result,
          completedAt: new Date(),
        },
      });

      // 5. Log Audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'plugin.executed',
        resource: 'Plugin',
        payload: {
          pluginId: data.pluginId,
          logId: log.id,
        },
      });

      return { logId: log.id, result };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  private async executePlugin(plugin: any, input: any): Promise<any> {
    // Mock execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      message: `Plugin ${plugin.id} executed successfully`,
      data: { input },
    };
  }

  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('plugins:execute').add(
      'failed-job',
      {
        originalQueue: 'plugins:execute',
        originalJobId: job.id!,
        attemptsMade: job.attemptsMade,
        error: error.message,
        stack: error.stack,
        failedAt: new Date(),
        payload: job.data,
        traceId: (job.data as any).traceId,
      },
    );

    await job.remove();
    this.logger.log(`Moved job ${job.id} to DLQ`);
  }
}
