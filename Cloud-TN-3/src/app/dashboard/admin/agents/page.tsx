"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  capabilities?: any;
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/agents", { cache: "no-store" });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setMessage(json.error || "خطا در بارگیری عامل‌ها");
      return;
    }
    setAgents(json.agents ?? []);
    setMessage(null);
  }

  useEffect(() => {
    load();
  }, []);

  async function runAgent(key: string) {
    const res = await fetch("/api/agents", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "اجرای عامل ناموفق بود");
      return;
    }
    setMessage("عامل اجرا شد");
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">عامل‌های هوشمند</h1>
          <p className="text-sm text-muted-foreground">اجرای دستی و مشاهده عامل‌ها</p>
        </div>
        <button className="rounded-md border px-4 py-2 text-sm" onClick={load} disabled={loading}>
          به‌روزرسانی
        </button>
      </div>
      {message ? <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{message}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{agent.key}</p>
                <h3 className="text-lg font-semibold">{agent.name}</h3>
              </div>
              <button
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                onClick={() => runAgent(agent.key)}
                disabled={!agent.isActive}
              >
                اجرا
              </button>
            </div>
            {agent.description ? <p className="text-sm leading-6">{agent.description}</p> : null}
            {agent.capabilities ? (
              <div className="text-xs text-muted-foreground">قابلیت‌ها: {Array.isArray(agent.capabilities) ? agent.capabilities.join("، ") : ""}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
