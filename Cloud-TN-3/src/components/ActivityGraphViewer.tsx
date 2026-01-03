import { useEffect, useState } from "react";

type Edge = { id: number; fromId: number; toId: number; relation: string; weight: number };
type Graph = {
  id: number;
  tag: string;
  edgesFrom: Edge[];
  edgesTo: Edge[];
};

export function ActivityGraphViewer({ apiBase = "" }: { apiBase?: string }) {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${apiBase}/identity/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!mounted || !me?.id) {
          setLoading(false);
          return;
        }
        fetch(`${apiBase}/identity/graph/${me.id}`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then((g) => {
            if (!mounted) return;
            setGraph(g);
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  if (loading) return <div className="text-slate-300 text-sm">در حال بارگذاری گراف فعالیت...</div>;
  if (!graph) return <div className="text-slate-400 text-sm">گرافی یافت نشد.</div>;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-right space-y-3">
      <h3 className="text-lg font-bold text-slate-100">گراف فعالیت</h3>
      <div className="text-xs text-slate-400">نود: {graph.id} / برچسب: {graph.tag}</div>
      <div className="space-y-2">
        <div className="text-xs text-slate-300">روابط خروجی:</div>
        {(graph.edgesFrom ?? []).slice(0, 10).map((e) => (
          <div key={e.id} className="text-xs text-slate-200 flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
            <span>→ {e.toId}</span>
            <span className="text-slate-400">{e.relation}</span>
            <span className="text-emerald-300">{e.weight.toFixed(2)}</span>
          </div>
        ))}
        {(graph.edgesFrom ?? []).length === 0 && <div className="text-xs text-slate-500">ارتباطی ثبت نشده.</div>}
      </div>
    </div>
  );
}
