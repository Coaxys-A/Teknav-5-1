"use client";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import WidgetContainer from "@/components/ui/WidgetContainer";
import SimpleTable from "@/components/ui/SimpleTable";
import SkeletonRows from "@/components/ui/SkeletonRows";
import ErrorState from "@/components/ui/ErrorState";

type Product = { name: string; slug: string; price: number; status?: string };

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/store/products");
        if (!res.ok) throw new Error("خطا در دریافت محصولات");
        const data = await res.json();
        setProducts(data ?? []);
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
      <PageHeader title="فروشگاه" description="محصولات، لایسنس‌ها، سفارش‌ها" />
      {loading && <SkeletonRows rows={3} />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="تعداد محصولات" value={products.length} />
          <StatCard label="منتشر شده" value={products.filter((p) => p.status === "active").length} />
          <StatCard label="پیش‌نویس" value={products.filter((p) => p.status !== "active").length} />
        </div>
      )}
      <WidgetContainer title="محصولات">
        {!loading && !error && (
          <SimpleTable
            columns={[
              { key: "name", header: "نام" },
              { key: "slug", header: "اسلاگ" },
              { key: "price", header: "قیمت" },
              { key: "status", header: "وضعیت" },
            ]}
            rows={products as any[]}
          />
        )}
      </WidgetContainer>
    </div>
  );
}
