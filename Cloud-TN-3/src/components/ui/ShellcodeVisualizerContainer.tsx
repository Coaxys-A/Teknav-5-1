import React from "react";

interface ShellcodeVisualizerContainerProps {
  children: React.ReactNode;
}

export function ShellcodeVisualizerContainer({ children }: ShellcodeVisualizerContainerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-2 flex items-center gap-2 text-xs text-cyan-200">
        <span className="h-2 w-2 rounded-full bg-cyan-400" />
        <span>Shellcode / Memory View</span>
      </div>
      <div className="rounded-xl border border-white/5 bg-slate-950/70 p-3">{children}</div>
    </div>
  );
}
