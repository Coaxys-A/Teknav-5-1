'use client';

import { useEffect, useState, useTransition, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  listTranslationMatrixAction,
  aiChatAction,
  aiToolAction,
  saveDraftAction,
  loadDraftAction,
  listRevisionsAction,
  translateAction,
  mediaUploadAction,
  listMediaAction,
  mediaCaptionAction,
} from "./editor-actions";
import { submitForReview, approveArticle, forcePublish, markReady } from "./actions";
import { publishArticleToFS } from "./publish-actions";
import Link from "next/link";

const metaSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  mainKeyword: z.string().optional(),
});
type MetaForm = z.infer<typeof metaSchema>;

type EditorClientProps = {
  articleId: string;
  initialContent?: string;
  initialMeta?: Partial<MetaForm>;
};

const aiModels = [
  { value: "deepseek", label: "DeepSeek R1" },
  { value: "gpt-oss-120b", label: "GPT-OSS-120B" },
  { value: "gpt-4", label: "GPT-4.x" },
];

const actions = [
  { value: "grammar", label: "Fix grammar" },
  { value: "technical", label: "Rewrite technical" },
  { value: "simple", label: "Rewrite simple" },
  { value: "extend", label: "Extend section" },
  { value: "expand", label: "Expand content" },
  { value: "shorten", label: "Shorten content" },
  { value: "summarize", label: "Summarize" },
  { value: "tldr", label: "Generate TL;DR" },
  { value: "takeaways", label: "Key Takeaways" },
  { value: "disclaimer", label: "Disclaimer" },
  { value: "prerequisites", label: "Prerequisites" },
  { value: "lastUpdated", label: "Last Updated" },
  { value: "breadcrumbs", label: "Breadcrumbs" },
  { value: "structure", label: "Structure" },
  { value: "seo", label: "SEO" },
  { value: "rewrite", label: "Magic Rewrite" },
];

export function EditorClient({ articleId, initialContent = "", initialMeta = {} }: EditorClientProps) {
  const [content, setContent] = useState(initialContent);
  const [aiModel, setAiModel] = useState<string>("deepseek");
  const [aiResult, setAiResult] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState<string>("grammar");
  const [isPending, startTransition] = useTransition();
  const [autoSave, setAutoSave] = useState(true);
  const [revisions, setRevisions] = useState<{ content: string; meta?: any; ts: number }[]>([]);
  const [media, setMedia] = useState<{ name: string; url: string; ts: number }[]>([]);
  const [preview, setPreview] = useState(false);
  const [translation, setTranslation] = useState({ source: "fa", target: "en", text: "" });
  const [translationResult, setTranslationResult] = useState("");
  const [translationMatrix, setTranslationMatrix] = useState<{ locale: string; status: string }[]>([
    { locale: "fa", status: "source" },
    { locale: "en", status: "missing" },
  ]);
  const [selectedDiff, setSelectedDiff] = useState<{ locale: string; content: string } | null>(null);
  const [lastSavedTs, setLastSavedTs] = useState<number | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<number | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const metaForm = useForm<MetaForm>({ resolver: zodResolver(metaSchema), defaultValues: { title: "", ...initialMeta } });

  useEffect(() => {
    loadDraftAction(articleId).then((res) => {
      if (res.draft) {
        setContent(res.draft.content);
        metaForm.reset(res.draft.meta as any);
        setLastSavedTs(res.draft.ts ?? Date.now());
        setRemoteVersion(res.draft.ts ?? null);
      }
    });
    listRevisionsAction(articleId).then((res) => {
      setRevisions(res.revisions);
      const newest = res.revisions?.[0]?.ts;
      if (newest) {
        setRemoteVersion(newest);
        if (lastSavedTs && newest > lastSavedTs) {
          setHasConflict(true);
        }
      }
    });
    listMediaAction(articleId).then((res) => setMedia(res.items));
    listTranslationMatrixAction(articleId).then((res) => setTranslationMatrix(res.rows));
  }, [articleId, metaForm, lastSavedTs]);

  useEffect(() => {
    if (!autoSave) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const ts = Date.now();
        await saveDraftAction({ articleId, content, meta: metaForm.getValues(), ts });
        if (remoteVersion && ts > remoteVersion) {
          setHasConflict(false);
        }
        setLastSavedTs(ts);
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [articleId, autoSave, content, metaForm]);

  const runChat = () => {
    startTransition(async () => {
      const res = await aiChatAction({ model: aiModel as any, message: prompt, context: content });
      setAiResult(res.reply);
    });
  };

  const runTool = () => {
    startTransition(async () => {
      const res = await aiToolAction({ model: aiModel as any, action: action as any, text: content });
      setAiResult(res.result);
    });
  };

  const runTranslate = () => {
    startTransition(async () => {
      const res = await translateAction({ articleId, ...translation });
      setTranslationResult(res.translated);
      const matrix = await listTranslationMatrixAction(articleId);
      setTranslationMatrix(matrix.rows);
    });
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await mediaUploadAction({ articleId, name: file.name, content: String(reader.result) });
      const items = await listMediaAction(articleId);
      setMedia(items.items);
      toast({ title: "Uploaded" });
    };
    reader.readAsDataURL(file);
  };

  const slugFromTitle = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Title" {...metaForm.register("title")} />
          <Select
            value={metaForm.watch("category") ?? ""}
            onValueChange={(val) => metaForm.setValue("category", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tech">Tech</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Tags (comma)"
            {...metaForm.register("tags")}
            onBlur={(e) => metaForm.setValue("tags", e.target.value)}
          />
          <Input placeholder="Main keyword" {...metaForm.register("mainKeyword")} />
          <Input placeholder="SEO title" {...metaForm.register("seoTitle")} />
          <Input placeholder="SEO description" {...metaForm.register("seoDescription")} />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={autoSave} onCheckedChange={(checked) => setAutoSave(Boolean(checked))} /> Enable autosave
          </div>
          {hasConflict ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              A newer draft exists.
              <Button
                size="sm"
                variant="link"
                className="p-0"
                onClick={() => {
                  const newest = revisions[0];
                  if (newest) {
                    setContent(newest.content);
                    metaForm.reset(newest.meta as any);
                    setHasConflict(false);
                  }
                }}
              >
                Restore latest
              </Button>
            </div>
          ) : null}
          {lastSavedTs ? (
            <div className="text-xs text-muted-foreground">Last saved: {new Date(lastSavedTs).toLocaleTimeString()}</div>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const ts = Date.now();
                await saveDraftAction({ articleId, content, meta: metaForm.getValues(), ts });
                setLastSavedTs(ts);
                toast({ title: "Draft saved" });
              })
            }
          >
            {isPending ? "Saving..." : "Save draft"}
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => setPreview((p) => !p)}>
            {preview ? "Edit Mode" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="rounded border bg-card p-4 whitespace-pre-wrap min-h-[420px]">{content}</div>
        ) : (
          <Textarea className="min-h-[420px]" value={content} onChange={(e) => setContent(e.target.value)} />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              startTransition(async () => {
                await submitForReview({ ids: [Number(articleId) || 1], payload: { reason: "submit" } });
                toast({ title: "Submitted for review" });
              })
            }
          >
            Submit for review
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              startTransition(async () => {
                await approveArticle({ ids: [Number(articleId) || 1] });
                toast({ title: "Approved" });
              })
            }
          >
            Approve (Editor)
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              startTransition(async () => {
                await markReady({ ids: [Number(articleId) || 1] });
                toast({ title: "Marked ready" });
              })
            }
          >
            Mark ready
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() =>
              startTransition(async () => {
                await forcePublish({ ids: [Number(articleId) || 1] });
                toast({ title: "Published" });
              })
            }
          >
            Force publish (Owner)
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() =>
              startTransition(async () => {
                await publishArticleToFS({
                  id: Number(articleId) || 1,
                  title: metaForm.getValues("title"),
                  content,
                  slug: slugFromTitle(metaForm.getValues("title")),
                  meta: metaForm.getValues(),
                });
                toast({ title: "Published to filesystem" });
              })
            }
          >
            Publish to FS
          </Button>
          <Button asChild size="sm" variant="link">
            <Link href={`/dashboard/writer/articles/${articleId}/preview`}>Preview page</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Tabs defaultValue="chat">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="translate">Translate</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="space-y-3">
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Ask the AI" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <Button type="button" onClick={runChat} disabled={isPending}>
              {isPending ? "Thinking..." : "Send"}
            </Button>
            <Textarea readOnly value={aiResult} className="min-h-[160px]" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setContent((c) => `${c}\n${aiResult}`)} disabled={!aiResult}>
                Append to article
              </Button>
              <Button size="sm" variant="outline" onClick={() => setContent(aiResult)} disabled={!aiResult}>
                Replace article
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="tools" className="space-y-3">
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={runTool} disabled={isPending}>
              {isPending ? "Applying..." : "Apply"}
            </Button>
            <Textarea readOnly value={aiResult} className="min-h-[160px]" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setContent((c) => `${c}\n${aiResult}`)} disabled={!aiResult}>
                Append to article
              </Button>
              <Button size="sm" variant="outline" onClick={() => setContent(aiResult)} disabled={!aiResult}>
                Replace article
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="seo" className="space-y-3">
            <Button type="button" onClick={runTool} disabled={isPending}>
              {isPending ? "Analyzing..." : "Run SEO"}
            </Button>
            <Textarea readOnly value={aiResult} className="min-h-[160px]" />
          </TabsContent>
          <TabsContent value="translate" className="space-y-3">
            <div className="rounded border bg-card p-3 text-sm">
              <div className="font-medium mb-2">Translation matrix</div>
              <div className="grid grid-cols-2 gap-2">
                {translationMatrix.map((row) => (
                  <div
                    key={row.locale}
                    className="flex items-center justify-between rounded border px-2 py-1 cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedDiff({ locale: row.locale, content: row.status })}
                  >
                    <span>{row.locale}</span>
                    <span className="text-xs text-muted-foreground">{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Source (fa)" value={translation.source} onChange={(e) => setTranslation({ ...translation, source: e.target.value })} />
              <Input placeholder="Target (en)" value={translation.target} onChange={(e) => setTranslation({ ...translation, target: e.target.value })} />
            </div>
            <Textarea
              placeholder="Text to translate"
              value={translation.text}
              onChange={(e) => setTranslation({ ...translation, text: e.target.value })}
            />
            <Button type="button" onClick={runTranslate} disabled={isPending || !translation.text}>
              {isPending ? "Translating..." : "Translate"}
            </Button>
            <Textarea readOnly value={translationResult} className="min-h-[160px]" />
            {selectedDiff ? (
              <div className="rounded border bg-card p-3">
                <div className="font-medium">Selected locale: {selectedDiff.locale}</div>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{selectedDiff.content}</pre>
              </div>
            ) : null}
          </TabsContent>
          <TabsContent value="media" className="space-y-3">
            <Input type="file" onChange={handleUpload} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  const res = await mediaCaptionAction(metaForm.getValues("title"));
                  setContent((c) => `${c}\n\n${res.caption}`);
                  toast({ title: "Caption generated" });
                })
              }
            >
              Generate caption
            </Button>
            <div className="space-y-2 text-sm">
              {media.length === 0 ? <div className="text-muted-foreground">No media</div> : null}
              {media.map((m, idx) => (
                <div key={idx} className="rounded border p-2">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(m.ts).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="revisions" className="space-y-3">
            <div className="space-y-2 text-sm">
              {revisions.length === 0 ? <div className="text-muted-foreground">No revisions</div> : null}
              {revisions.map((r, idx) => (
                <div
                  key={idx}
                  className="rounded border p-2 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setContent(r.content);
                    metaForm.reset(r.meta as any);
                  }}
                >
                  <div className="text-xs text-muted-foreground">{new Date(r.ts).toLocaleString()}</div>
                  <div className="line-clamp-2 text-sm">{r.content.slice(0, 120)}</div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="templates" className="space-y-3">
            <Button type="button" onClick={() => setContent((c) => `${c}\n\nTemplate: News analysis`)} variant="outline">
              Insert template
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
