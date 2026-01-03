"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

type Plugin = {
  key: string;
  name: string;
  visibility?: string;
  updatedAt?: string;
};

export default function AdminPluginsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/plugins");
        if (!res.ok) throw new Error("خطا در دریافت لیست پلاگین‌ها");
        const data = await res.json();
        setPlugins(data ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت پلاگین‌ها"
        description="نمایش و مدیریت پلاگین‌های متصل"
        actions={<a className="rounded-lg bg-slate-900 px-3 py-2 text-white" href="/dashboard/admin/plugins/add">افزودن پلاگین</a>}
      />
      <WidgetContainer title="لیست پلاگین‌ها">
        {loading && <SkeletonRows rows={4} />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <SimpleTable
            columns={[
              { key: "name", header: "نام" },
              { key: "key", header: "کلید" },
              { key: "visibility", header: "دسترسی" },
              {
                key: "actions",
                header: "عملیات",
                render: (p: Plugin) => (
                  <div className="flex gap-2">
                    <a className="text-sm text-blue-600" href={`/dashboard/admin/plugins/${p.key}`}>جزئیات</a>
                  </div>
                ),
              },
            ]}
            rows={plugins as any[]}
          />
        )}
      </WidgetContainer>
    </div>
  );
}
