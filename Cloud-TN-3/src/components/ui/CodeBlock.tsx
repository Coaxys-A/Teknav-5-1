"use client";

import React, { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = "bash", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs text-slate-300">
        <span>{title ?? language.toUpperCase()}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
        >
          {copied ? "کپی شد" : "کپی"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
