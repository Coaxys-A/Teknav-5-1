"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/shells/DashboardShell";
import { SectionHeader, SimpleTable, PillBadge } from "@/components/ui";

type Experiment = { key: string; status: string; variants?: any; description?: string };

export default function AdminExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/experiments", { cache: "no-store" });
        const json = await res.json();
        if (Array.isArray(json)) setExperiments(json);
      } catch {
        setExperiments([]);
      }
    })();
  }, []);

  const nav = [
    { href: "/dashboard/admin", label: "Overview" },
    { href: "/dashboard/admin/plugins", label: "Plugins" },
    { href: "/dashboard/admin/feature-flags", label: "Feature Flags" },
    { href: "/dashboard/admin/experiments", label: "Experiments" },
    { href: "/dashboard/admin/workflows", label: "Workflows" },
    { href: "/dashboard/admin/store", label: "Store" },
  ];

  return (
    <DashboardShell title="Experiments" description="A/B تست‌ها و مولتی‌وریانت" navItems={nav}>
      <SectionHeader title="آزمایش‌ها" />
      <SimpleTable
        columns={[
          { key: "key", header: "کلید" },
          { key: "description", header: "توضیح" },
          {
            key: "status",
            header: "وضعیت",
            render: (row: any) => <PillBadge text={row.status} color={row.status === "running" ? "emerald" : "slate"} />,
          },
          { key: "variants", header: "واریانت‌ها", render: (row: any) => JSON.stringify(row.variants ?? {}) },
        ]}
        data={experiments}
        emptyText="آزمایشی ثبت نشده."
      />
    </DashboardShell>
  );
}
