import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiScenarioService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(body: any) {
    const { workspaceId, tenantId, seed, objectives } = body;
    const task = await this.prisma.aiTask.create({
      data: {
        workspaceId,
        tenantId,
        type: 'scenario.generate',
        payload: { seed, objectives },
        status: 'completed',
        result: {
          stages: [],
          seed,
        },
      },
    });
    return task;
  }
}
