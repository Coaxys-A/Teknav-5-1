import { callBackend } from "@/lib/backend";
import { StorePurchaseGrid } from "@/components/store/StorePurchaseGrid";
import { ProductCard } from "@/components/products/ProductCard";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  productType: string;
  interval?: string | null;
}

export default async function StorePage() {
  let products: Product[] = [];
  try {
    products = await callBackend<Product[]>({ path: "/products", method: "GET", cache: "no-store" });
  } catch {
    products = [];
  }

  return (
    <section className="space-y-8 px-6 py-12" dir="rtl">
      <header className="text-right space-y-2">
        <p className="text-sm text-slate-500">فروشگاه تِکنَو — پلن‌ها و محصولات</p>
        <h1 className="text-3xl font-bold text-slate-900">خرید اشتراک، لایسنس و خدمات</h1>
        <p className="text-slate-600">
          طرح‌های اشتراکی برای دسترسی به موتور AI، داشبورد سئو، آکادمی و ابزار امنیت. پرداخت‌ها ایمن و تحت نقش‌های کاربری شما کنترل می‌شوند.
        </p>
      </header>
      <StorePurchaseGrid products={products} />
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
