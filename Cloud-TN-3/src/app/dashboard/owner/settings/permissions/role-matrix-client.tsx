"use client";

import { useEffect, useState, useTransition } from "react";
import { RoleDef, RolePermission, assignRole, fetchPermissions, savePermissions, saveRole } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

const resources = ["articles", "users", "workspaces", "plugins", "ai", "store", "logs", "workflows"];
const actions = ["read", "write", "delete", "manage"];

export function RoleMatrixClient({ initialRoles, initialPermissions }: { initialRoles: RoleDef[]; initialPermissions: RolePermission[] }) {
  const [roles, setRoles] = useState<RoleDef[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<RoleDef | null>(initialRoles[0] ?? null);
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const m: Record<string, boolean> = {};
    initialPermissions.forEach((p) => {
      m[`${p.resource}:${p.action}`] = true;
    });
    setMatrix(m);
  }, [initialPermissions]);

  const toggle = (res: string, act: string, val: boolean) => {
    setMatrix((prev) => ({ ...prev, [`${res}:${act}`]: val }));
  };

  const save = () => {
    if (!selectedRole) return;
    const enabled = Object.entries(matrix)
      .filter(([, v]) => v)
      .map(([k]) => k.split(":"));
    const resourcesSel = Array.from(new Set(enabled.map(([r]) => r)));
    const actionsSel = Array.from(new Set(enabled.map(([, a]) => a)));
    startTransition(async () => {
      await savePermissions(selectedRole.id!, resourcesSel, actionsSel);
      toast({ title: "Permissions saved" });
    });
  };

  const addRole = () => {
    const name = prompt("Role name?");
    if (!name) return;
    startTransition(async () => {
      await saveRole({ name, scope: "tenant" });
      const nextRoles = await fetch("/rbac/roles");
      const list = await nextRoles.json();
      setRoles(list);
      setSelectedRole(list.find((r: any) => r.name === name) ?? null);
    });
  };

  const selectRole = (role: RoleDef) => {
    setSelectedRole(role);
    startTransition(async () => {
      const perms = await fetchPermissions(role.id!);
      const m: Record<string, boolean> = {};
      perms.forEach((p) => (m[`${p.resource}:${p.action}`] = true));
      setMatrix(m);
    });
  };

  const handleAssign = () => {
    const userId = Number(prompt("User ID?") ?? "0");
    if (!userId || !selectedRole) return;
    startTransition(async () => {
      await assignRole({ userId, role: selectedRole.name });
      toast({ title: "Role assigned" });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {roles.map((r) => (
          <Button key={r.name} variant={selectedRole?.id === r.id ? "default" : "outline"} size="sm" onClick={() => selectRole(r)}>
            {r.name}
          </Button>
        ))}
        <Button size="sm" onClick={addRole} variant="secondary">
          Add role
        </Button>
        <Button size="sm" onClick={handleAssign} variant="outline">
          Assign to user
        </Button>
      </div>
      {selectedRole ? (
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                {actions.map((a) => (
                  <TableHead key={a}>{a}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((res) => (
                <TableRow key={res}>
                  <TableCell className="font-medium">{res}</TableCell>
                  {actions.map((act) => (
                    <TableCell key={act}>
                      <Checkbox checked={!!matrix[`${res}:${act}`]} onCheckedChange={(c) => toggle(res, act, !!c)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending}>
          {isPending ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
      <div className="rounded border p-3 space-y-2">
        <div className="font-semibold">Role details</div>
        <Input placeholder="Name" value={selectedRole?.name ?? ""} readOnly />
        <Input placeholder="Scope" value={selectedRole?.scope ?? ""} readOnly />
      </div>
    </div>
  );
}
