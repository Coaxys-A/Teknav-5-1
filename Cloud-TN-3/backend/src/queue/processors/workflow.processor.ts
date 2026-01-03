import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed, Job } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { QueueService } from '../queue.service';
import { z } from 'zod';

/**
 * Workflow Processor
 *
 * Handles workflow execution jobs.
 * Job names:
 * - run-workflow: Execute workflow steps
 */

@Processor('workflows:run')
export class WorkflowProcessor {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly dlq: DlqService,
    private readonly metrics: QueueMetricsService,
    private readonly queueService: QueueService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
    this.metrics.publishJobEvent('workflows:run', job.id!, 'completed');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error);
    this.metrics.publishJobEvent('workflows:run', job.id!, 'failed', { error: error.message });

    // Move to DLQ if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      this.moveToDLQ(job, error);
    }
  }

  @Process('run-workflow')
  async handleRunWorkflow(job: Job) {
    this.logger.log(`Processing run-workflow job ${job.id}`);

    const schema = z.object({
      workflowInstanceId: z.number(),
      userId: z.number(),
      tenantId: z.string(),
    });

    try {
      const data = schema.parse(job.data);

      // 1. Get Workflow Instance
      const instance = await this.prisma.workflowInstance.findUnique({
        where: { id: data.workflowInstanceId },
        include: { workflow: true },
      });

      if (!instance) {
        throw new Error(`Workflow instance ${data.workflowInstanceId} not found`);
      }

      // 2. Update instance status
      await this.prisma.workflowInstance.update({
        where: { id: data.workflowInstanceId },
        data: { status: 'running' },
      });

      // 3. Get Workflow Definition (steps)
      const definition = instance.workflow.definition as any;
      const steps = definition.steps || [];

      if (steps.length === 0) {
        // No steps, complete
        await this.prisma.workflowInstance.update({
          where: { id: data.workflowInstanceId },
          data: { status: 'completed', completedAt: new Date() },
        });
        return { instanceId: data.workflowInstanceId, status: 'completed' };
      }

      // 4. Execute steps sequentially (for simplicity)
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await this.executeStep(data.workflowInstanceId, data.userId, step, i);
      }

      // 5. Update instance status to completed
      await this.prisma.workflowInstance.update({
        where: { id: data.workflowInstanceId },
        data: { status: 'completed', completedAt: new Date() },
      });

      // 6. Log audit
      await this.auditLog.logAction({
        actorUserId: data.userId,
        action: 'workflow.run.completed',
        resource: 'WorkflowInstance',
        payload: {
          workflowInstanceId: data.workflowInstanceId,
          workflowId: instance.workflowId,
        },
      });

      return { instanceId: data.workflowInstanceId, status: 'completed' };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    workflowInstanceId: number,
    userId: number,
    step: any,
    stepIndex: number,
  ) {
    // 1. Create WorkflowStepExecution record
    const stepExecution = await this.prisma.workflowStepExecution.create({
      data: {
        workflowInstanceId,
        stepName: step.name,
        stepType: step.type,
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    try {
      // 2. Execute step based on type
      if (step.type === 'http') {
        await this.executeHttpStep(step);
      } else if (step.type === 'ai') {
        await this.executeAiStep(step);
      } else if (step.type === 'plugin') {
        await this.executePluginStep(step);
      } else if (step.type === 'delay') {
        await this.executeDelayStep(step);
      } else {
        throw new Error(`Unsupported step type: ${step.type}`);
      }

      // 3. Update step status to completed
      await this.prisma.workflowStepExecution.update({
        where: { id: stepExecution.id },
        data: { status: 'completed', completedAt: new Date() },
      });
    } catch (error) {
      // 4. Update step status to failed
      await this.prisma.workflowStepExecution.update({
        where: { id: stepExecution.id },
        data: { status: 'failed', error: error.message, completedAt: new Date() },
      });

      throw error; // Re-throw to trigger retry/DLQ
    }
  }

  /**
   * Execute HTTP step
   */
  private async executeHttpStep(step: any) {
    // Mock HTTP call
    this.logger.log(`Executing HTTP step: ${step.name}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Execute AI step
   */
  private async executeAiStep(step: any) {
    // Mock AI call
    this.logger.log(`Executing AI step: ${step.name}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Execute Plugin step
   */
  private async executePluginStep(step: any) {
    // Mock plugin execution
    this.logger.log(`Executing Plugin step: ${step.name}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Execute Delay step
   */
  private async executeDelayStep(step: any) {
    const delay = step.duration || 5000;
    this.logger.log(`Executing Delay step: ${step.name} (${delay}ms)`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Move job to DLQ
   */
  private async moveToDLQ(job: Job, error: Error) {
    await this.dlq.getDLQQueue('workflows:run').add(
      'failed-job',
      {
        originalQueue: 'workflows:run',
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
