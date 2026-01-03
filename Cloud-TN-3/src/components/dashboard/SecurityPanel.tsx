interface SecurityPanelProps {
  items: Array<{ title: string; status: "safe" | "warn" | "action"; detail: string }>;
}

export function SecurityPanel({ items }: SecurityPanelProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <p className="font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              item.status === "safe"
                ? "bg-emerald-100 text-emerald-700"
                : item.status === "warn"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            {item.status === "safe" ? "ایمن" : item.status === "warn" ? "نیاز به بررسی" : "اقدام فوری"}
          </span>
        </div>
      ))}
    </div>
  );
}
