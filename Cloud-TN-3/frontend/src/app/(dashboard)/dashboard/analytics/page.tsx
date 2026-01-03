"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ views: number; users: number; conversions: number }>({
    views: 0,
    users: 0,
    conversions: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/analytics/summary");
        if (!res.ok) throw new Error("خطا در دریافت آنالیتیکس");
        const data = await res.json();
        setSummary({
          views: data.views ?? 0,
          users: data.users ?? 0,
          conversions: data.conversions ?? 0,
        });
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
      <PageHeader title="آنالیتیکس" description="ترافیک و عملکرد" />
      {loading && <SkeletonRows rows={3} />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="بازدید" value={summary.views} />
          <StatCard label="کاربران" value={summary.users} />
          <StatCard label="تبدیل" value={summary.conversions} />
        </div>
      )}
      <WidgetContainer title="نمودارها">
        <div className="text-sm text-slate-500">در حال توسعه...</div>
      </WidgetContainer>
    </div>
  );
}
