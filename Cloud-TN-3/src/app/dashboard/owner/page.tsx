import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { PlaceholderSlot, PlaceholderStatCard } from '@/components/dashboard/owner/placeholder-slots';

export default function OwnerOverviewPage() {
  return (
    <OwnerPageShell
      title="پنل مالک"
      description="نمای کلی پلتفرم و وضعیت سیستم"
    >
      <section data-slot="overview-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlaceholderStatCard />
        <PlaceholderStatCard />
        <PlaceholderStatCard />
        <PlaceholderStatCard />
      </section>

      <section data-slot="quick-actions" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">عملیات سریع</h3>
          <PlaceholderSlot type="content" />
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">وضعیت سیستم</h3>
          <PlaceholderSlot type="content" />
        </div>
      </section>
    </OwnerPageShell>
  );
}
