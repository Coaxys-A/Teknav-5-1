import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WorkflowDefinition } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowRegistry } from './workflow.registry';
import { LoggingService } from '../logging/logging.service';
import { BullQueueService } from '../queue/bullmq.service';

type Trigger = { type: string; [k: string]: any };
type Step = {
  key?: string;
  type?: string;
  action?: string;
  input?: any;
  payload?: any;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  if?: string;
  rollbackToStep?: string;
};

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: WorkflowRegistry,
    private readonly logging: LoggingService,
    private readonly bull: BullQueueService,
  ) {}

  private normalizeTriggers(def: WorkflowDefinition): Trigger[] {
    const raw = (def.triggers as any) ?? [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return [raw as Trigger];
    return [];
  }

  private normalizeSteps(def: WorkflowDefinition): Step[] {
    const raw = (def.steps as any) ?? [];
    if (Array.isArray(raw?.steps)) return raw.steps;
    if (Array.isArray(raw)) return raw;
    return [];
  }

  async start(triggerKey: string, context: Record<string, any>, tenantId?: number | null, workspaceId?: number | null) {
    const defs = await this.prisma.workflowDefinition.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
      },
    });
    for (const def of defs) {
      const triggers = this.normalizeTriggers(def);
      const matches = triggers.some((t) => t.type === triggerKey);
      if (!matches) continue;
      await this.enqueue(def.id, context, tenantId ?? null, workspaceId ?? null);
    }
  }

  async enqueue(workflowId: number, context: Record<string, any>, tenantId: number | null, workspaceId: number | null) {
    await this.bull.addJob('workflow', { workflowId, context, tenantId, workspaceId }, { attempts: 5 });
  }

  private async updateInstanceContext(instanceId: number, context: any) {
    await this.prisma.workflowInstance.update({ where: { id: instanceId }, data: { context } });
  }

  async runDefinition(def: WorkflowDefinition, context: Record<string, any>, tenantId: number | null, workspaceId: number | null) {
    const steps = this.normalizeSteps(def);
    const instance = await this.prisma.workflowInstance.create({
      data: {
        workflowId: def.id,
        context: context as Prisma.InputJsonValue,
        status: 'running',
        currentStep: 0,
        tenantId,
      },
    });

    let currentContext: any = { ...(context ?? {}) };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepKey = step.key ?? `step_${i}`;
      const exec = await this.prisma.workflowStepExecution.create({
        data: {
          instanceId: instance.id,
          stepKey,
          stepType: step.type ?? 'action',
          input: { ...step.input, context: currentContext },
          status: 'running',
          startedAt: new Date(),
        },
      });

      const retries = Number(step.retries ?? 0);
      const timeoutMs = Number(step.timeoutMs ?? 0);
      const payload = { ...(currentContext ?? {}), ...(step.payload ?? {}) };
      let attempt = 0;
      let success = false;

      while (attempt <= retries && !success) {
        try {
          if (step.if) {
            const [left, right] = String(step.if).split('==').map((p) => p.trim());
            const val = (currentContext as any)[left];
            if (`${val}` !== right.replace(/['"]/g, '')) {
              await this.prisma.workflowStepExecution.update({
                where: { id: exec.id },
                data: { status: 'skipped', finishedAt: new Date(), output: { skipped: true } },
              });
              success = true;
              break;
            }
          }

          const runPromise = this.registry.execute(step.action ?? stepKey, payload);
          const result: any = timeoutMs
            ? await Promise.race([
                runPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
              ])
            : await runPromise;

          currentContext = { ...currentContext, ...(result?.context ?? {}), lastResult: result?.output ?? result };

          await this.prisma.workflowStepExecution.update({
            where: { id: exec.id },
            data: {
              status: 'completed',
              output: result?.output ?? result,
              finishedAt: new Date(),
            },
          });
          await this.logging.logWorkflow(instance.id, stepKey, 'completed');

          await this.updateInstanceContext(instance.id, currentContext);
          success = true;
        } catch (error) {
          attempt += 1;
          const isLast = attempt > retries;
          this.logger.error(`Workflow step failed ${stepKey} attempt ${attempt}`, error as Error);
          if (isLast) {
            await this.prisma.workflowStepExecution.update({
              where: { id: exec.id },
              data: {
                status: 'failed',
                errorMessage: (error as Error).message,
                finishedAt: new Date(),
              },
            });
            await this.prisma.workflowInstance.update({
              where: { id: instance.id },
              data: { status: 'failed', finishedAt: new Date(), currentStep: i },
            });
            await this.logging.logWorkflow(instance.id, stepKey, 'failed', (error as Error).message);
            if (step.rollbackToStep) {
              await this.prisma.workflowInstance.update({
                where: { id: instance.id },
                data: { status: 'rollback', currentStep: Math.max(0, i - 1) },
              });
            }
            return;
          }
          if (step.retryDelayMs) {
            await new Promise((resolve) => setTimeout(resolve, Number(step.retryDelayMs)));
          }
        }
      }
    }

    await this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: { status: 'completed', finishedAt: new Date(), currentStep: steps.length, context: currentContext },
    });
  }
}
