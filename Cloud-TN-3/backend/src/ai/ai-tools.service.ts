import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTools(workspaceId?: number) {
    return this.prisma.aiTool.findMany({
      where: workspaceId ? { bindings: { some: { workspaceId } } } : undefined,
      include: { bindings: true },
    });
  }

  async validateBinding(agentId: number, toolId: number, workspaceId?: number) {
    const binding = await this.prisma.aiToolBinding.findFirst({
      where: {
        agentId,
        toolId,
        enabled: true,
        workspaceId: workspaceId ?? undefined,
      },
      include: { tool: true },
    });
    if (!binding) throw new Error('Tool binding not found or disabled');
    return binding;
  }

  async executeTool(params: {
    agentId: number;
    toolId: number;
    input: any;
    workspaceId?: number;
    taskId?: number;
    runId?: number;
  }) {
    const binding = await this.validateBinding(params.agentId, params.toolId, params.workspaceId);
    // TODO: add schema validation, timeout, plugin delegation
    const output = { echo: params.input };
    return { binding, output };
  }
}
