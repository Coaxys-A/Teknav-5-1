"use client";

import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  imageUrl?: string | null;
  merchantName?: string | null;
  rating?: number | null;
  affiliateUrl?: string | null;
}

export function ProductCard({ product, articleId }: { product: Product; articleId?: number }) {
  const href = product.affiliateUrl
    ? `/api/products/${product.id}/click${articleId ? `?articleId=${articleId}` : ""}`
    : product.imageUrl ?? "#";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" dir="rtl">
      <div className="flex gap-3">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-20 w-20 rounded object-cover" />
        )}
        <div className="flex-1 space-y-1">
          <div className="text-lg font-semibold text-slate-900">{product.name}</div>
          {product.merchantName && <div className="text-xs text-slate-500">فروشنده: {product.merchantName}</div>}
          {product.description && <div className="text-sm text-slate-600 line-clamp-2">{product.description}</div>}
          <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
            <span>
              {product.price.toLocaleString("fa-IR")} {product.currency}
            </span>
            {product.rating && <span className="text-amber-600">★ {product.rating.toFixed(1)}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Link
          href={href}
          className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          مشاهده / خرید
        </Link>
      </div>
    </div>
  );
}
