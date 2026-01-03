"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/shells/DashboardShell";
import { SectionHeader, SimpleTable, PillBadge } from "@/components/ui";

type Flag = { key: string; description?: string; enabled: boolean; configuration?: any };

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<Flag[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/feature-flags", { cache: "no-store" });
        const json = await res.json();
        if (Array.isArray(json)) setFlags(json);
      } catch {
        setFlags([]);
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
    <DashboardShell title="Feature Flags" description="مشاهده و مدیریت پرچم‌ها" navItems={nav}>
      <SectionHeader title="لیست پرچم‌ها" />
      <SimpleTable
        columns={[
          { key: "key", header: "کلید" },
          { key: "description", header: "توضیح" },
          {
            key: "enabled",
            header: "وضعیت",
            render: (row: any) => <PillBadge text={row.enabled ? "فعال" : "غیرفعال"} color={row.enabled ? "emerald" : "rose"} />,
          },
        ]}
        data={flags}
        emptyText="پرچمی ثبت نشده است."
      />
    </DashboardShell>
  );
}
