'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const models = [
  { value: "deepseek", label: "DeepSeek R1" },
  { value: "gpt-oss-120b", label: "GPT-OSS-120B" },
  { value: "gpt-4", label: "GPT-4.x" },
];

export function ModelSwitcher({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
