import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { PlaceholderSlot, PlaceholderTable } from '@/components/dashboard/owner/placeholder-slots';

export default function OwnerUsersPage() {
  return (
    <OwnerPageShell
      title="کاربران"
      description="مدیریت دسترسی‌ها و نقش‌های کاربران"
      actions={
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
          افزودن کاربر
        </button>
      }
    >
      {/* Filter Bar */}
      <div data-slot="filter" className="flex gap-4 items-center">
        <PlaceholderSlot type="filter" className="flex-1" />
        <PlaceholderSlot type="filter" />
        <PlaceholderSlot type="filter" />
      </div>

      {/* Users Table */}
      <section data-slot="users-table">
        <PlaceholderTable rows={10} />
      </section>
    </OwnerPageShell>
  );
}
