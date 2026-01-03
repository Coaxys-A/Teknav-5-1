import type { Metadata } from "next";
import Section from "@/components/Section";
import { site, canonicalize } from "@/lib/seo";

export const metadata: Metadata = {
  title: `درباره ما | ${site.name}`,
  description: `${site.name} — رسانه‌ی مستقل فناوری و امنیت سایبری.`,
  alternates: { canonical: canonicalize("/about") },
  openGraph: {
    title: `درباره ما | ${site.name}`,
    description: `${site.name} — رسانه‌ی مستقل فناوری و امنیت سایبری.`,
    url: canonicalize("/about"),
    siteName: site.name,
    type: "website",
    locale: "fa_IR",
  },
};

export default function AboutPage() {
  return (
    <Section title="درباره ما">
      <p className="text-slate-700 leading-8">
        تکناو رسانه‌ای مستقل در حوزه‌ی فناوری و امنیت سایبری است. مأموریت ما: پوشش سریع، دقیق و بی‌حاشیه‌ی خبرها، تحلیل‌ها و آموزش‌ها.
      </p>
    </Section>
  );
}
