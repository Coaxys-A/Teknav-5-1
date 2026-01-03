'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArticleTemplate } from "../../admin/article-templates/actions";
import { applyTemplateToDraft, listTemplates } from "../../admin/article-templates/actions";

export function TemplatePicker({ onApply }: { onApply?: (key: string) => void }) {
  const [templates, setTemplates] = useState<ArticleTemplate[]>([]);
  const [selected, setSelected] = useState<string>("");

  const load = async () => {
    const res = await listTemplates();
    setTemplates(res);
  };

  if (templates.length === 0) {
    load();
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.key} value={t.key}>
              {t.titlePattern}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        onClick={async () => {
          if (!selected) return;
          await applyTemplateToDraft({ key: selected, articleId: "new" });
          onApply?.(selected);
        }}
      >
        Apply
      </Button>
    </div>
  );
}
