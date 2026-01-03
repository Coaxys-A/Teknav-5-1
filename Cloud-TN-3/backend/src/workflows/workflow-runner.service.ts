import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowRunnerService {
  private readonly logger = new Logger(WorkflowRunnerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a workflow and log all steps
   */
  async executeWorkflow(params: {
    workflowId: number;
    actorId: number;
    tenantId?: number;
    workspaceId?: number;
    input?: Record<string, any> | null;
  }) {
    this.logger.log(`Starting workflow execution: ${params.workflowId}`);

    // Get workflow definition
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { id: params.workflowId },
      include: { steps: true },
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${params.workflowId}`);
    }

    // Create workflow instance
    const instance = await this.prisma.workflowInstance.create({
      data: {
        workflowDefinitionId: workflow.id,
        actorUserId: params.actorId,
        tenantId: params.tenantId || null,
        workspaceId: params.workspaceId || null,
        status: 'pending',
        input: params.input ? JSON.stringify(params.input) : null,
        startedAt: new Date(),
      },
    });

    this.logger.debug(`Created workflow instance: ${instance.id}`);

    // Execute steps sequentially
    const steps = workflow.steps.sort((a, b) => (a.order - b.order));
    let instanceStatus = 'success';

    for (const step of steps) {
      const stepExecution = await this.executeStep({
        instanceId: instance.id,
        stepId: step.id,
        stepType: step.type,
        stepConfig: step.config ? JSON.parse(step.config) : null,
        input: params.input,
      });

      if (stepExecution.status === 'failed') {
        instanceStatus = 'failed';
        break; // Stop on first failure
      }

      if (stepExecution.status === 'skipped') {
        this.logger.debug(`Step ${step.id} skipped, continuing...`);
      }
    }

    // Update instance final status
    const finishedAt = new Date();
    const updatedInstance = await this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: instanceStatus,
        finishedAt,
      },
    });

    this.logger.log(`Workflow execution completed: ${instance.id}, status: ${instanceStatus}`);

    return updatedInstance;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(params: {
    instanceId: number;
    stepId: number;
    stepType: string;
    stepConfig: Record<string, any> | null;
    input?: Record<string, any> | null;
  }) {
    this.logger.debug(`Executing step: ${params.stepId}, type: ${params.stepType}`);

    const stepExecution = await this.prisma.workflowStepExecution.create({
      data: {
        workflowInstanceId: params.instanceId,
        stepId: params.stepId,
        status: 'running',
        startedAt: new Date(),
      },
    });

    let output: any = null;
    let errorMessage: string | null = null;
    let durationMs: number = 0;
    let status: 'success' | 'failed' | 'skipped' = 'success';

    const startTime = Date.now();

    try {
      // Execute based on step type
      switch (params.stepType) {
        case 'api_call':
          output = await this.executeApiCall(params.stepConfig, params.input);
          break;

        case 'delay':
          await this.executeDelay(params.stepConfig);
          output = { delayed: true };
          break;

        case 'condition':
          const shouldContinue = await this.executeCondition(params.stepConfig, params.input);
          if (!shouldContinue) status = 'skipped';
          break;

        case 'transform':
          output = await this.executeTransform(params.stepConfig, params.input);
          break;

        default:
          throw new Error(`Unknown step type: ${params.stepType}`);
      }

      durationMs = Date.now() - startTime;
      status = 'success';

    } catch (error: any) {
      durationMs = Date.now() - startTime;
      status = 'failed';
      errorMessage = error.message || 'Unknown error';
      this.logger.error(`Step ${params.stepId} failed:`, error);
    }

    // Update step execution
    await this.prisma.workflowStepExecution.update({
      where: { id: stepExecution.id },
      data: {
        status,
        finishedAt: new Date(),
        durationMs,
        errorMessage,
        output: output ? JSON.stringify(output) : null,
      },
    });

    return await this.prisma.workflowStepExecution.findUnique({
      where: { id: stepExecution.id },
    });
  }

  /**
   * Execute API call step
   */
  private async executeApiCall(config: Record<string, any> | null, input: any) {
    // In real implementation, this would make the API call
    // For now, simulate API call with input
    this.logger.debug(`Executing API call: ${config?.url || 'unknown'}`);

    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      response: { message: 'API call executed' },
    };
  }

  /**
   * Execute delay step
   */
  private async executeDelay(config: Record<string, any> | null) {
    const delayMs = config?.duration || 1000;
    this.logger.debug(`Delaying for ${delayMs}ms`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Execute condition step
   */
  private async executeCondition(config: Record<string, any> | null, input: any) {
    this.logger.debug(`Evaluating condition: ${config?.condition || 'true'}`);

    // In real implementation, evaluate condition
    // For now, always return true (continue)
    return true;
  }

  /**
   * Execute transform step
   */
  private async executeTransform(config: Record<string, any> | null, input: any) {
    this.logger.debug(`Executing transform: ${config?.operation || 'passthrough'}`);

    // In real implementation, apply transformation
    // For now, pass input through
    return input;
  }
}
