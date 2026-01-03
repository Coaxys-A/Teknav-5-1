"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

type Experiment = { key: string; name: string; status: string; createdAt?: string };

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/experiments");
        if (!res.ok) throw new Error("خطا در دریافت آزمایش‌ها");
        const data = await res.json();
        setExperiments(data ?? []);
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
      <PageHeader title="آزمایش‌ها" description="A/B و rollout" />
      <WidgetContainer title="لیست آزمایش‌ها">
        {loading && <SkeletonRows rows={4} />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <SimpleTable
            columns={[
              { key: "name", header: "نام" },
              { key: "key", header: "کلید" },
              { key: "status", header: "وضعیت" },
            ]}
            rows={experiments as any[]}
          />
        )}
      </WidgetContainer>
    </div>
  );
}
