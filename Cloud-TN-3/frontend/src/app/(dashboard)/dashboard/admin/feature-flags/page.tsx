"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

type Flag = {
  key: string;
  description?: string;
  enabled: boolean;
  createdAt?: string;
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/feature-flags");
        if (!res.ok) throw new Error("خطا در دریافت فلگ‌ها");
        const data = await res.json();
        setFlags(data ?? []);
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
      <PageHeader title="Feature Flags" description="مدیریت rollout و ویژگی‌ها" />
      <WidgetContainer title="فلگ‌ها">
        {loading && <SkeletonRows rows={4} />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <SimpleTable
            columns={[
              { key: "key", header: "کلید" },
              { key: "description", header: "توضیح" },
              { key: "enabled", header: "فعال", render: (f: Flag) => (f.enabled ? "بله" : "خیر") },
            ]}
            rows={flags as any[]}
          />
        )}
      </WidgetContainer>
    </div>
  );
}
