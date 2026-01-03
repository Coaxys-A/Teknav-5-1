import { useEffect, useState } from "react";

type IdentityNode = {
  id: number;
  tag: string;
  personas?: { id: number; label: string }[];
  trustScores?: { id: number; score: number; reason?: string | null }[];
};

export function IdentityPanel({ apiBase = "" }: { apiBase?: string }) {
  const [identity, setIdentity] = useState<IdentityNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${apiBase}/identity/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted) return;
        setIdentity(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  if (loading) {
    return <div className="text-slate-300 text-sm">در حال بارگذاری هویت...</div>;
  }

  if (!identity) {
    return <div className="text-slate-400 text-sm">هویتی یافت نشد.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-right">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-100">هویت شما</h3>
        <span className="text-xs text-slate-400">برچسب: {identity.tag}</span>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-slate-300">پرسوناها:</div>
        <div className="flex flex-wrap gap-2">
          {(identity.personas ?? []).map((p) => (
            <span key={p.id} className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-100">
              {p.label}
            </span>
          ))}
          {(!identity.personas || identity.personas.length === 0) && (
            <span className="text-xs text-slate-500">پرسونایی ثبت نشده.</span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-slate-300">امتیاز اعتماد:</div>
        <div className="flex flex-wrap gap-2">
          {(identity.trustScores ?? []).map((t) => (
            <span key={t.id} className="px-3 py-1 rounded-full bg-emerald-800/40 border border-emerald-700 text-xs text-emerald-100">
              {t.score.toFixed(2)} {t.reason ? `(${t.reason})` : ""}
            </span>
          ))}
          {(!identity.trustScores || identity.trustScores.length === 0) && (
            <span className="text-xs text-slate-500">امتیازی ثبت نشده.</span>
          )}
        </div>
      </div>
    </div>
  );
}
