"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Editor = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default), { ssr: false });

interface Props {
  value: string;
  onChange: (v: string) => void;
  height?: number;
}

export function RichMarkdownEditor({ value, onChange, height = 400 }: Props) {
  return (
    <div data-color-mode="light" className="rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
      <Editor
        value={value}
        height={height}
        visibleDragbar={false}
        onChange={(v = "") => onChange(v)}
        preview="edit"
      />
    </div>
  );
}
