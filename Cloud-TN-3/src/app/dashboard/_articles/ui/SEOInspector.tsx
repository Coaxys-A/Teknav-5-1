'use client';

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { aiAssistAction } from "../ai-assist";
import { toast } from "@/components/ui/use-toast";

export function SEOInspector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await aiAssistAction({ model: "deepseek", mode: "seo", text });
    if (!res.ok) {
      toast({ title: "SEO failed" });
      setLoading(false);
      return;
    }
    setResult(res.result);
    toast({ title: "SEO analyzed" });
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <Textarea placeholder="Paste content for SEO" value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={run} disabled={loading}>
        {loading ? "Running..." : "Inspect SEO"}
      </Button>
      <Textarea readOnly value={result} className="min-h-[160px]" />
    </div>
  );
}
