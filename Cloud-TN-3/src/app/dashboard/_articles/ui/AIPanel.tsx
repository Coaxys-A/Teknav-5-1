'use client';

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiAssistAction, saveConversation } from "../ai-assist";
import { toast } from "@/components/ui/use-toast";

const models = [
  { value: "deepseek", label: "DeepSeek R1" },
  { value: "gpt-oss-120b", label: "GPT-OSS-120B" },
  { value: "gpt-4", label: "GPT-4.x" },
];

const commands = [
  { value: "rewrite", label: "AI Rewrite" },
  { value: "summary", label: "AI Summary" },
  { value: "expand", label: "AI Expansion" },
  { value: "tone", label: "AI Tone" },
  { value: "seo", label: "AI SEO" },
  { value: "title", label: "AI Title" },
  { value: "meta", label: "AI Meta" },
  { value: "keywords", label: "AI Keywords" },
  { value: "headline", label: "AI Headline" },
  { value: "factcheck", label: "AI Fact-check" },
  { value: "hallucination", label: "AI Hallucination" },
  { value: "persian", label: "AI Persian Opt" },
  { value: "technical", label: "AI Technical" },
];

export function AIPanel({ session }: { session: string }) {
  const [model, setModel] = useState("deepseek");
  const [mode, setMode] = useState("rewrite");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const res = await aiAssistAction({ model: model as any, mode: mode as any, text: input });
      if (res.ok) {
        setResult(res.result);
        await saveConversation({ session, role: "user", content: input });
        await saveConversation({ session, role: "assistant", content: res.result });
        toast({ title: "AI completed" });
      } else {
        toast({ title: "Error", description: "AI failed" });
      }
    });
  };

  return (
    <Tabs defaultValue="chat">
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="tools">Tools</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="meta">Meta</TabsTrigger>
      </TabsList>
      <TabsContent value="chat" className="space-y-3">
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger>
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea placeholder="Ask AI" value={input} onChange={(e) => setInput(e.target.value)} />
        <Button onClick={run} disabled={isPending}>
          {isPending ? "Running..." : "Send"}
        </Button>
        <Textarea readOnly value={result} className="min-h-[160px]" />
      </TabsContent>
      <TabsContent value="tools" className="space-y-3">
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger>
            <SelectValue placeholder="Command" />
          </SelectTrigger>
          <SelectContent>
            {commands.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea placeholder="Text" value={input} onChange={(e) => setInput(e.target.value)} />
        <Button onClick={run} disabled={isPending}>
          {isPending ? "Running..." : "Run"}
        </Button>
        <Textarea readOnly value={result} className="min-h-[160px]" />
      </TabsContent>
      <TabsContent value="seo" className="space-y-3">
        <Button onClick={run} disabled={isPending}>
          {isPending ? "Optimizing..." : "Optimize SEO"}
        </Button>
        <Textarea readOnly value={result} className="min-h-[160px]" />
      </TabsContent>
      <TabsContent value="meta" className="space-y-3">
        <Button onClick={run} disabled={isPending}>
          {isPending ? "Generating..." : "Generate Meta"}
        </Button>
        <Textarea readOnly value={result} className="min-h-[160px]" />
      </TabsContent>
    </Tabs>
  );
}
