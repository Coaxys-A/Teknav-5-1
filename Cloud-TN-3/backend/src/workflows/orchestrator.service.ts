import { Injectable } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Injectable()
export class OrchestratorService {
  constructor(private readonly workflows: WorkflowService) {}

  async runWorkflow(key: string, payload: Record<string, any>, tenantId?: number | null) {
    return this.workflows.start(key, payload, tenantId ?? null);
  }
}
