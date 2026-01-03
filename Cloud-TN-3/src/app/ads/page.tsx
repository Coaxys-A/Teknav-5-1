import { readAds } from "@/lib/ads";

export const metadata = {
  title: "تبلیغات",
};

export default async function AdsPreviewPage() {
  const ads = await readAds();
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-10 text-right">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">نمایش تبلیغات فعال</h1>
        <p className="text-muted-foreground">تبلیغات به صورت خودکار بر اساس وزن نمایش داده می‌شوند.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {ads.items.map((item, index) => (
          <article key={`${item.position}-${index}`} className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">موقعیت: {item.position}</h2>
            <p className="mt-2 text-sm text-muted-foreground">آدرس تصویر: {item.creativeUrl}</p>
            {item.linkUrl && <p className="text-xs text-muted-foreground">لینک مقصد: {item.linkUrl}</p>}
            <p className="mt-2 text-xs text-muted-foreground">وزن نمایش: {item.weight ?? 1}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
