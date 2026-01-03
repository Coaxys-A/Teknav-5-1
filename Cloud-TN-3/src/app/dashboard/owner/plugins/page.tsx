import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { PlaceholderSlot, PlaceholderStatCard, PlaceholderTable } from '@/components/dashboard/owner/placeholder-slots';

export default function OwnerPluginsPage() {
  return (
    <OwnerPageShell
      title="افزونه‌ها"
      description="مدیریت و نصب پلاگین‌های پلتفرم"
    >
      {/* Plugins Metrics */}
      <section data-slot="plugins-metrics" className="grid gap-4 md:grid-cols-4">
        <PlaceholderStatCard />
        <PlaceholderStatCard />
        <PlaceholderStatCard />
        <PlaceholderStatCard />
      </section>

      {/* Plugins Marketplace */}
      <section data-slot="plugins-marketplace">
        <PlaceholderTable rows={6} />
      </section>
    </OwnerPageShell>
  );
}
