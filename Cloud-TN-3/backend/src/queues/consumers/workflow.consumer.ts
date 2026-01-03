import { Processor, ProcessError } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { WorkflowRunnerService } from '../../workflows/workflow-runner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';

/**
 * Workflow Jobs Consumer
 * 
 * Queue: workflow
 * Job Types:
 * - run_workflow_instance
 * - trigger_workflow
 */

@Injectable()
export class WorkflowConsumer {
  private readonly logger = new Logger(WorkflowConsumer.name);

  constructor(
    private readonly workflowRunner: WorkflowRunnerService,
    private readonly prisma: PrismaService,
  ) {}

  @Processor('run_workflow_instance')
  async handleRunWorkflowInstance(job: Job) {
    const traceId = randomUUID();
    this.logger.debug(`Processing run_workflow_instance job ${job.id}`);

    try {
      const data = job.data;

      // Create/update WorkflowInstance
      const instance = await this.workflowRunner.executeWorkflow({
        workflowId: data.workflowId,
        actorId: data.actorId,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        input: data.input,
      });

      return instance;

    } catch (error: any) {
      this.logger.error(`Workflow execution failed for workflow ${job.data.workflowId}:`, error.message);
      
      // Update WorkflowInstance with error
      // (WorkflowRunnerService handles this internally)
      
      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('trigger_workflow')
  async handleTriggerWorkflow(job: Job) {
    this.logger.debug(`Processing trigger_workflow job ${job.id}`);
    
    // Trigger workflow execution
    // For now, delegate to run_workflow_instance
    return await this.handleRunWorkflowInstance(job);
  }
}
