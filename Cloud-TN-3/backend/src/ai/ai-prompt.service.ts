import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiPromptService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(workspaceId: number | undefined, key: string) {
    return this.prisma.aiPromptTemplate.findFirst({
      where: { key, workspaceId },
      orderBy: { version: 'desc' },
    });
  }

  buildPrompt(input: {
    agent: any;
    task: any;
    memory: any[];
    userProfile?: any;
    workspaceProfile?: any;
  }) {
    const system = input.agent?.systemPrompt ?? 'You are TEKNAV AI agent.';
    const persona = input.userProfile?.tone ?? input.workspaceProfile?.defaultTone ?? 'neutral';
    const memoryChunks = (input.memory ?? []).map((m) => m.content).slice(0, 6);
    const messages = [
      { role: 'system', content: `${system}\nTone:${persona}` },
      ...memoryChunks.map((m) => ({ role: 'system', content: JSON.stringify(m) })),
      ...(input.task?.payload ? [{ role: 'user', content: JSON.stringify(input.task.payload) }] : []),
    ];
    return {
      messages,
      temperature: input.agent?.modelConfig?.temperature ?? 0.2,
      maxTokens: input.agent?.modelConfig?.maxTokens ?? 2048,
    };
  }
}
