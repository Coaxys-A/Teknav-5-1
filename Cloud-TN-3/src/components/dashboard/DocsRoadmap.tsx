type DocItem = {
  title: string;
  status: "done" | "wip" | "planned";
  link?: string;
};

export function DocsRoadmap({ items }: { items: DocItem[] }) {
  const badge = (status: DocItem["status"]) => {
    switch (status) {
      case "done":
        return "bg-emerald-100 text-emerald-700";
      case "wip":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.title} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
          <div>
            <p className="font-semibold text-slate-900">{item.title}</p>
            {item.link && (
              <a href={item.link} className="text-xs text-[color:var(--color-brand)] underline">
                مشاهده
              </a>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${badge(item.status)}`}>
            {item.status === "done" ? "تکمیل شده" : item.status === "wip" ? "در حال تدوین" : "برنامه‌ریزی"}
          </span>
        </li>
      ))}
    </ul>
  );
}
