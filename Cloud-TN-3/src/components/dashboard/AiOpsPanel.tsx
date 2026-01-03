interface AiOpsPanelProps {
  assistants: Array<{ name: string; state: "ready" | "running" | "idle"; desc: string }>;
}

export function AiOpsPanel({ assistants }: AiOpsPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {assistants.map((agent) => (
        <div key={agent.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{agent.name}</p>
              <p className="text-xs text-slate-500">{agent.desc}</p>
            </div>
            <span
              className={`text-[11px] font-bold ${
                agent.state === "ready"
                  ? "text-emerald-600"
                  : agent.state === "running"
                    ? "text-[color:var(--color-brand)]"
                    : "text-slate-400"
              }`}
            >
              {agent.state === "ready"
                ? "آماده"
                : agent.state === "running"
                  ? "فعال"
                  : "در انتظار"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
