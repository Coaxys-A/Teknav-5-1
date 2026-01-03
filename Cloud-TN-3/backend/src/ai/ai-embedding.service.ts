import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiEmbeddingService {
  constructor(private readonly prisma: PrismaService) {}

  private textToVector(text: string, dimensions = 64): number[] {
    const v = new Array(dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      v[i % dimensions] += code / 255;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }

  private cosine(a: number[], b: number[]) {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
    return dot / denom;
  }

  async createNode(input: {
    label: string;
    type?: string;
    tenantId?: number;
    workspaceId?: number;
    payload?: any;
    contextTags?: string[];
    priority?: number;
    decay?: number;
  }) {
    return this.prisma.memoryNode.create({
      data: {
        label: input.label,
        type: input.type ?? 'content',
        tenantId: input.tenantId,
        workspaceId: input.workspaceId,
        payload: input.payload,
        contextTags: input.contextTags ?? [],
        priority: input.priority ?? 0,
        decay: input.decay ?? 1,
      },
    });
  }

  async addEmbedding(input: { nodeId: number; vector: any; modality?: string }) {
    return this.prisma.memoryEmbedding.create({
      data: {
        nodeId: input.nodeId,
        vector: input.vector,
        modality: input.modality ?? 'text',
      },
    });
  }

  async embedAndStore(input: {
    label: string;
    content: string;
    type?: string;
    tenantId?: number;
    workspaceId?: number;
    contextTags?: string[];
    priority?: number;
  }) {
    const node = await this.createNode({
      label: input.label,
      type: input.type ?? 'content',
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      payload: { text: input.content },
      contextTags: input.contextTags,
      priority: input.priority,
    });
    const vector = this.textToVector(input.content);
    await this.addEmbedding({ nodeId: node.id, vector });
    return node;
  }

  async listNodes(tenantId?: number, workspaceId?: number) {
    return this.prisma.memoryNode.findMany({
      where: { tenantId, workspaceId },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      include: { embeddings: true },
    });
  }

  async querySimilar(input: {
    tenantId?: number;
    workspaceId?: number;
    type?: string;
    limit?: number;
    queryVector?: number[];
    queryText?: string;
  }) {
    const nodes = await this.prisma.memoryNode.findMany({
      where: { tenantId: input.tenantId, workspaceId: input.workspaceId, type: input.type ?? undefined },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      include: { embeddings: true },
      take: input.limit ?? 50,
    });
    const qv = input.queryVector ?? (input.queryText ? this.textToVector(input.queryText) : undefined);
    if (!qv) return nodes;
    const scored = nodes.map((n) => {
      const vec = (n.embeddings?.[0]?.vector as number[]) ?? [];
      const score = vec.length ? this.cosine(qv, vec) : 0;
      return { ...n, score };
    });
    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return scored.slice(0, input.limit ?? 20);
  }
}
