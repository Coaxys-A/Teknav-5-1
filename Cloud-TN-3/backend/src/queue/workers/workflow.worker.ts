import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WorkflowService } from '../../../workflows/workflow.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * Workflow Worker
 */

@Injectable()
export class WorkflowWorker {
  private readonly logger = new Logger(WorkflowWorker.name);

  constructor(
    private readonly workflowService: WorkflowService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('run-workflow')
  async handleRunWorkflow(job: Job) {
    this.logger.debug(`Processing workflow run job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.workflowService.executeWorkflow(data.workflowInstanceId);

      await this.auditLog.logAction({
        actorId: 0,
        action: 'workflow.run',
        resource: 'WorkflowInstance',
        payload: { workflowInstanceId: data.workflowInstanceId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to run workflow:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('execute-step')
  async handleExecuteStep(job: Job) {
    this.logger.debug(`Processing workflow step job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.workflowService.executeStep(data.stepExecutionId);

      await this.auditLog.logAction({
        actorId: 0,
        action: 'workflow.step.executed',
        resource: 'WorkflowStepExecution',
        payload: { stepExecutionId: data.stepExecutionId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to execute step:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
