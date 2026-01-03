import Link from "next/link";
import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title: string;
  href?: string;
  children: ReactNode;
}

export default function Section({ id, title, href, children }: SectionProps) {
  return (
    <section
      id={id}
      className="container-xl relative overflow-hidden py-10"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_90%_15%,rgba(59,168,255,0.06),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.05),transparent_45%)] dark:bg-[radial-gradient(circle_at_12%_22%,rgba(59,168,255,0.12),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.08),transparent_36%),radial-gradient(circle_at_52%_88%,rgba(16,185,129,0.08),transparent_48%)]" />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={id ? `${id}-title` : undefined} className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {href && (
          <Link
            className="text-sm font-semibold text-[color:var(--color-brand)] hover:text-[color:var(--color-brand-dark)] dark:text-[color:var(--color-brand)]"
            href={href}
          >
            مشاهده همه
          </Link>
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
