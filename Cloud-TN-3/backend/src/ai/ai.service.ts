import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiRuntimeService } from './ai-runtime.service';
import { AiMemoryService } from './ai-memory.service';
import { AiToolsService } from './ai-tools.service';
import { AiPromptService } from './ai-prompt.service';
import { AiJobsService } from './ai-jobs.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: AiRuntimeService,
    private readonly memory: AiMemoryService,
    private readonly tools: AiToolsService,
    private readonly prompts: AiPromptService,
    private readonly jobs: AiJobsService,
  ) {}

  async listModels() {
    const defaults = [
      {
        id: 'openai/gpt-oss-120b:free',
        provider: 'openai',
        label: 'GPT-OSS 120B (Free)',
        supportsTools: true,
      },
      {
        id: process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-r1-0528:free',
        provider: 'openrouter',
        label: 'OpenRouter Default',
        supportsTools: true,
      },
    ];
    const dbModels = await this.prisma.aiModelConfig.findMany();
    return [...defaults, ...dbModels];
  }

  async listAgents(workspaceId?: number) {
    return this.prisma.aiAgent.findMany({
      where: { workspaceId, deletedAt: null },
      include: { toolBindings: { include: { tool: true } }, modelConfig: true },
      orderBy: { id: 'desc' },
    });
  }

  async createTask(input: {
    workspaceId?: number;
    tenantId?: number;
    agentId?: number;
    toolId?: number;
    type: string;
    payload?: any;
    createdByUserId?: number;
    scheduledAt?: Date;
    priority?: number;
  }) {
    const task = await this.prisma.aiTask.create({
      data: {
        workspaceId: input.workspaceId,
        tenantId: input.tenantId,
        agentId: input.agentId,
        toolId: input.toolId,
        type: input.type,
        payload: input.payload,
        status: 'pending',
        createdByUserId: input.createdByUserId,
        scheduledAt: input.scheduledAt,
        priority: input.priority ?? 0,
      },
    });
    await this.jobs.enqueueTask(task.id);
    return task;
  }

  async getTask(id: number) {
    return this.prisma.aiTask.findUnique({
      where: { id },
      include: {
        runs: true,
        jobs: true,
        messages: true,
        agent: true,
        tool: true,
      },
    });
  }

  async outline(body: any, _workspaceId?: number) {
    return ['مقدمه', 'بدنه', 'نتیجه', body?.topic ?? 'موضوع'];
  }

  async rewrite(body: any, _workspaceId?: number) {
    return body?.text ?? '';
  }

  async suggestMetadata(body: any, _workspaceId?: number) {
    return {
      title: body?.title ?? 'عنوان پیشنهادی',
      metaDescription: 'توضیح متای پیشنهادی',
      keywords: ['teknav', 'ai'],
    };
  }
}
