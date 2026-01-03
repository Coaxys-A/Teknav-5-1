type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href ?? "#"}
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand)]/5"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">{action.label}</span>
            <span aria-hidden className="text-lg text-slate-400 group-hover:text-[color:var(--color-brand)]">
              &gt;
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">اقدام فوری برای سرعت بیشتر در تیم</p>
        </a>
      ))}
    </div>
  );
}
