import type { Metadata } from "next";
import Section from "@/components/Section";
import { site, canonicalize } from "@/lib/seo";

export const metadata: Metadata = {
  title: `تماس با ما | ${site.name}`,
  description: `ارتباط با ${site.name} برای همکاری و ارسال پیشنهادها.`,
  alternates: { canonical: canonicalize("/contact") },
  openGraph: {
    title: `تماس با ما | ${site.name}`,
    description: `ارتباط با ${site.name} برای همکاری و ارسال پیشنهادها.`,
    url: canonicalize("/contact"),
    siteName: site.name,
    type: "website",
    locale: "fa_IR",
  },
};

export default function ContactPage() {
  return (
    <Section title="تماس با ما">
      <form method="POST" action="/api/contact" className="max-w-lg space-y-3">
        <label htmlFor="contact-name" className="sr-only">
          نام
        </label>
        <input
          id="contact-name"
          name="name"
          required
          placeholder="نام"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="contact-email" className="sr-only">
          ایمیل
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          placeholder="ایمیل"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="contact-subject" className="sr-only">
          موضوع
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          placeholder="موضوع"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <label htmlFor="contact-message" className="sr-only">
          پیام
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          placeholder="پیام"
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-[color:var(--color-brand)]"
        />
        <input type="text" name="hp" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden />
        <button className="rounded-lg bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5">
          ارسال
        </button>
      </form>
    </Section>
  );
}
