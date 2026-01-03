import { Injectable } from '@nestjs/common';
import { MemoryGraphService } from '../memory-graph/memory-graph.service';
import { PersonalizationService } from '../personalization/personalization.service';
import { IdentityService } from '../identity/identity.service';

@Injectable()
export class IntelligenceService {
  constructor(
    private readonly memory: MemoryGraphService,
    private readonly personalization: PersonalizationService,
    private readonly identity: IdentityService,
  ) {}

  async ingestInteraction(params: {
    tenantId?: number | null;
    userId?: number | null;
    type: string;
    payload?: any;
    nodeLabel?: string;
    nodeType?: string;
  }) {
    await this.memory.recordEvent({
      tenantId: params.tenantId ?? null,
      userId: params.userId ?? null,
      type: params.type,
      payload: params.payload,
      nodeLabel: params.nodeLabel,
      nodeType: params.nodeType,
    });
    if (params.userId) {
      await this.personalization.updateRealtimeState(params.userId, params.tenantId ?? null, {
        lastEvent: params.type,
        ts: Date.now(),
      });
    }
    if (params.userId) {
      const identity = await this.identity.resolveIdentity(params.userId, params.tenantId ?? null);
      await this.identity.updateTrust(identity.id, 0.0, `event:${params.type}`);
    }
    return { ok: true };
  }
}
