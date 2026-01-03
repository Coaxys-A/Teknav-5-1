import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { PlaceholderSlot, PlaceholderStatCard } from '@/components/dashboard/owner/placeholder-slots';

export default function OwnerStorePage() {
  return (
    <OwnerPageShell
      title="فروشگاه"
      description="مدیریت اشتراک‌ها و محصولات پلتفرم"
    >
      {/* Store Metrics */}
      <section data-slot="store-metrics" className="grid gap-4 md:grid-cols-3">
        <PlaceholderStatCard />
        <PlaceholderStatCard />
        <PlaceholderStatCard />
      </section>

      {/* Products & Subscriptions */}
      <section data-slot="store-tabs" className="space-y-4">
        <div className="rounded-xl border bg-card">
          <div className="h-14 border-b" />
          <PlaceholderSlot type="content" className="h-64" />
        </div>
      </section>
    </OwnerPageShell>
  );
}
