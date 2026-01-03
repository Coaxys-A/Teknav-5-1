import Link from "next/link";
import { Meteors } from "./ui/meteors";
import { ParticleOrbs } from "./ui/particle-orbs";

export default function Hero() {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 animate-[pulse_8s_ease-in-out_infinite] bg-[radial-gradient(circle_at_30%_20%,rgba(59,168,255,0.14),transparent_40%),radial-gradient(circle_at_70%_10%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.08),transparent_45%)]" />
        <div className="absolute inset-0 animate-[spin_22s_linear_infinite] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>
      <div className="container-xl grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
        <div className="order-2 md:order-1">
          <h1 className="font-display text-3xl font-extrabold leading-tight text-slate-900 dark:text-slate-100 md:text-5xl">
            فناوری را هوشمندانه دنبال کنید
          </h1>
          <p className="mt-4 text-lg text-slate-700 dark:text-slate-200">
            خبرهای دقیق، تحلیل‌های بدون حاشیه و آموزش‌های کاربردی از دنیای دیجیتال و امنیت سایبری.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#latest"
              className="rounded-lg bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
            >
              آخرین خبرها
            </Link>
            <Link
              href="/cyber"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)] focus-visible:border-[color:var(--color-brand)]"
            >
              امنیت سایبری
            </Link>
          </div>
        </div>
        <div
          className="order-1 h-56 rounded-2xl bg-gradient-to-br from-[color:var(--color-brand-light)] to-[color:var(--color-accent)] shadow-[var(--shadow-soft)] md:order-2 md:h-72 glass relative overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-0 animate-pulse-slow bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.25),transparent_30%)]" />
          <div className="absolute inset-0 pointer-events-none">
            <Meteors number={26} className="opacity-70" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-6 top-6 h-16 w-16 rounded-full bg-white/5 blur-xl" />
            <div className="absolute right-10 bottom-10 h-12 w-12 rounded-full bg-white/10 blur-lg" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-6 rounded-xl border border-white/10" />
            <div className="absolute inset-0 animate-[drift_12s_linear_infinite] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_55%)]" />
          </div>
          <ParticleOrbs />
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center text-xs font-mono text-white/80">
            <span className="px-3 py-1 rounded-full bg-white/12 backdrop-blur-sm border border-white/10 shadow-lg">
              Teknav Signal • 110010 • 010101
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
