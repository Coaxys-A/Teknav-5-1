type FeedItem = {
  title: string;
  meta: string;
  tag?: string;
};

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">فعلاً رخدادی ثبت نشده است.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.title} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-900">{item.title}</p>
            {item.tag && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                {item.tag}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
        </li>
      ))}
    </ul>
  );
}
