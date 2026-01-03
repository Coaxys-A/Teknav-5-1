"use server";

import { revalidatePath } from "next/cache";
import { callBackend } from "@/lib/backend";

export type WorkflowDefinition = {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  triggers: any;
  steps: any;
  isActive: boolean;
  createdAt: string;
};

export type WorkflowInstance = {
  id: number;
  workflowId: number;
  status: string;
  currentStep: number;
  createdAt: string;
  finishedAt: string | null;
  workflow?: { key: string; name: string };
};

export type WorkflowStepExecution = {
  id: number;
  stepKey: string;
  stepType: string;
  status: string;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export async function getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  try {
    return await callBackend<WorkflowDefinition[]>({ path: "/workflows/definitions", method: "GET" });
  } catch {
    return [];
  }
}

export async function getWorkflowVersions(key: string): Promise<WorkflowDefinition[]> {
  try {
    return await callBackend<WorkflowDefinition[]>({ path: `/workflows/definitions/${key}/versions`, method: "GET" });
  } catch {
    return [];
  }
}

export async function getWorkflowInstances(): Promise<WorkflowInstance[]> {
  try {
    return await callBackend<WorkflowInstance[]>({ path: "/workflows/instances", method: "GET" });
  } catch {
    return [];
  }
}

export async function getInstanceSteps(id: number): Promise<WorkflowStepExecution[]> {
  try {
    return await callBackend<WorkflowStepExecution[]>({ path: `/workflows/instances/${id}/steps`, method: "GET" });
  } catch {
    return [];
  }
}

export async function saveWorkflowGraph(input: {
  key: string;
  name: string;
  description?: string;
  triggers: any;
  graph: any;
  steps: any[];
  versionLabel?: string;
  deploy?: boolean;
}) {
  await callBackend({
    path: `/workflows/definitions/${input.key}/graph`,
    method: "POST",
    body: input,
  });
  revalidatePath("/dashboard/owner/workflows");
}

export async function deployWorkflowDefinition(id: number) {
  await callBackend({ path: `/workflows/definitions/${id}/deploy`, method: "POST" });
  revalidatePath("/dashboard/owner/workflows");
}

export async function rollbackWorkflow(key: string) {
  await callBackend({ path: `/workflows/definitions/${key}/rollback`, method: "POST" });
  revalidatePath("/dashboard/owner/workflows");
}
