"use server";

import { callBackend } from "@/lib/backend";

export type RoleDef = { id?: number; name: string; scope?: string; description?: string; priority?: number };
export type RolePermission = { resource: string; action: string };

export async function fetchRoles(): Promise<RoleDef[]> {
  try {
    return await callBackend<RoleDef[]>({ path: "/rbac/roles", method: "GET" });
  } catch {
    return [];
  }
}

export async function fetchPermissions(roleId: number): Promise<RolePermission[]> {
  try {
    return await callBackend<RolePermission[]>({ path: `/rbac/permissions/${roleId}`, method: "GET" });
  } catch {
    return [];
  }
}

export async function saveRole(role: RoleDef) {
  await callBackend({ path: "/rbac/roles", method: "POST", body: role });
}

export async function savePermissions(roleId: number, resources: string[], actions: string[]) {
  await callBackend({ path: `/rbac/permissions/${roleId}`, method: "POST", body: { resources, actions } });
}

export async function assignRole(input: { userId: number; role: string; tenantId?: number; workspaceId?: number }) {
  await callBackend({ path: "/rbac/assignments", method: "POST", body: input });
}
