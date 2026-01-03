import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BullQueueService } from '../queue/bullmq.service';
import { AiRuntimeService } from './ai-runtime.service';
import { AiEventService } from './ai-event.service';

@Injectable()
export class AiJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bull: BullQueueService,
    private readonly runtime: AiRuntimeService,
    private readonly events: AiEventService,
  ) {}

  async enqueueTask(taskId: number) {
    const job = await this.prisma.aiJob.create({
      data: {
        taskId,
        status: 'queued',
      },
    });
    await this.bull.addJob('ai-content', { taskId }, { attempts: 3 });
    return job;
  }

  async processJob(taskId: number) {
    const task = await this.prisma.aiTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('TASK_NOT_FOUND');
    await this.prisma.aiJob.updateMany({ where: { taskId }, data: { status: 'running' } });
    try {
      if (task.agentId) {
        await this.runtime.runAgent({
          agentId: task.agentId,
          workspaceId: task.workspaceId ?? undefined,
          tenantId: task.tenantId ?? undefined,
          userId: task.createdByUserId ?? undefined,
          input: task.payload,
        });
      }
      await this.prisma.aiJob.updateMany({ where: { taskId }, data: { status: 'completed', finishedAt: new Date() } });
    } catch (error: any) {
      await this.prisma.aiJob.updateMany({
        where: { taskId },
        data: { status: 'failed', finishedAt: new Date(), errorMessage: error?.message },
      });
      await this.events.log({
        taskId,
        level: 'error',
        message: 'ai.job.failed',
        metadata: { error: error?.message },
      });
      throw error;
    }
  }
}
