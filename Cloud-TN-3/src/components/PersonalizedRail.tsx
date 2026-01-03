import { useEffect, useState } from "react";
import { fetchPersonalizationState } from "@/lib/personalization";

type Item = { id: number; title: string; slug?: string };

export function PersonalizedRail({ apiBase = "" }: { apiBase?: string }) {
  const [prefs, setPrefs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPersonalizationState(apiBase).then((data) => {
      if (!mounted) return;
      setPrefs(data.preferences ?? {});
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  if (loading) {
    return <div className="text-sm text-slate-300">در حال شخصی‌سازی محتوا...</div>;
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-right text-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">بر اساس علایق شما</h3>
        <span className="text-xs text-slate-400">محورهای فعال</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(prefs).length === 0 && (
          <span className="text-xs text-slate-400">سیگنال فعالی ثبت نشده است.</span>
        )}
        {Object.entries(prefs).map(([k, v]) => (
          <span key={k} className="px-3 py-1 rounded-full bg-slate-800 text-xs">
            {k} ({v.toFixed(1)})
          </span>
        ))}
      </div>
    </div>
  );
}
