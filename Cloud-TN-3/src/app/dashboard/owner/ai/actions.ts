"use server";

import { callBackend } from "@/lib/backend";

export type AiEventLog = {
  id: number;
  level: string;
  message: string;
  metadata?: any;
  createdAt: string;
  agentId?: number | null;
  toolId?: number | null;
  taskId?: number | null;
  runId?: number | null;
};

export type MemoryNode = {
  id: number;
  label: string;
  type: string;
  contextTags?: string[];
  priority?: number;
  updatedAt: string;
  embeddings?: { id: number; modality: string; vector: any }[];
};

export async function fetchAiEvents(limit = 50): Promise<AiEventLog[]> {
  try {
    return await callBackend<AiEventLog[]>({ path: `/ai/events?limit=${limit}`, method: "GET" });
  } catch {
    return [];
  }
}

export async function fetchEmbeddings(): Promise<MemoryNode[]> {
  try {
    return await callBackend<MemoryNode[]>({ path: "/ai/embeddings", method: "GET" });
  } catch {
    return [];
  }
}
