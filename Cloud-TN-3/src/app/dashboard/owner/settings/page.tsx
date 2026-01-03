import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { PlaceholderSlot } from '@/components/dashboard/owner/placeholder-slots';

export default function OwnerSettingsPage() {
  return (
    <OwnerPageShell
      title="تنظیمات"
      description="پیکربندی‌های سطح پلتفرم"
    >
      <section data-slot="settings-tabs" className="space-y-6">
        <div className="rounded-xl border bg-card">
          <div className="h-14 border-b" />
          <PlaceholderSlot type="content" className="h-64" />
        </div>
      </section>
    </OwnerPageShell>
  );
}
