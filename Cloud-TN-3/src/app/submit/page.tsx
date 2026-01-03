import type { Metadata } from "next";
import Section from "@/components/Section";
import { site, canonicalize } from "@/lib/seo";

export const metadata: Metadata = {
  title: `ارسال مقاله | ${site.name}`,
  description: `ارسال مقاله برای بررسی در ${site.name}.`,
  alternates: { canonical: canonicalize("/submit") },
  openGraph: {
    title: `ارسال مقاله | ${site.name}`,
    description: `ارسال مقاله برای بررسی در ${site.name}.`,
    url: canonicalize("/submit"),
    siteName: site.name,
    type: "website",
    locale: "fa_IR",
  },
};

export default function SubmitPage() {
  return (
    <Section title="ارسال مقاله">
      <form method="POST" action="/api/submit" className="max-w-2xl space-y-3">
        <label htmlFor="submit-title" className="sr-only">
          عنوان
        </label>
        <input
          id="submit-title"
          name="title"
          required
          placeholder="عنوان"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="submit-category" className="sr-only">
          دسته
        </label>
        <input
          id="submit-category"
          name="category"
          placeholder="دسته (slug)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="submit-image" className="sr-only">
          تصویر
        </label>
        <input
          id="submit-image"
          name="image"
          placeholder="آدرس تصویر شاخص (اختیاری)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="submit-excerpt" className="sr-only">
          خلاصه
        </label>
        <textarea
          id="submit-excerpt"
          name="excerpt"
          placeholder="خلاصه (اختیاری)"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="submit-content" className="sr-only">
          متن مقاله
        </label>
        <textarea
          id="submit-content"
          name="content"
          required
          placeholder="متن کامل مقاله"
          rows={10}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <input type="text" name="hp" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden />
        <button className="rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5">
          ارسال برای بررسی
        </button>
      </form>
      <p className="mt-3 text-xs text-slate-500">
        با ارسال محتوا، قوانین انتشار و حق بازنشر را می‌پذیرید.
      </p>
    </Section>
  );
}
