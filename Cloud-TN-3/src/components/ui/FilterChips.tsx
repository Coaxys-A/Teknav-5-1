import React from "react";

interface FilterChipsProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              active ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/40" : "bg-white/5 text-slate-200 border border-white/10"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
