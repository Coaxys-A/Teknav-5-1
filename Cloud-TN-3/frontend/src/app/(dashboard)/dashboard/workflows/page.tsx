"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

type Workflow = { key: string; name: string; status: string; trigger?: string };

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/workflows/definitions");
        if (!res.ok) throw new Error("خطا در دریافت گردش‌کارها");
        const data = await res.json();
        setWorkflows(data ?? []);
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
      <PageHeader title="گردش‌کارها" description="Pipeline و تریگرها" />
      <WidgetContainer title="لیست گردش‌کارها">
        {loading && <SkeletonRows rows={4} />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <SimpleTable
            columns={[
              { key: "name", header: "نام" },
              { key: "key", header: "کلید" },
              { key: "status", header: "وضعیت" },
            ]}
            rows={workflows as any[]}
          />
        )}
      </WidgetContainer>
    </div>
  );
}
