'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlockEditor, Block } from '@/components/article/BlockEditor';
import { AISidePanel } from '@/components/article/AISidePanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Save, Globe, Calendar, MoreVertical, ArrowLeft, CheckCircle2, FileText } from 'lucide-react';

export default function OwnerArticleEditPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const { id } = params;
  const [article, setArticle] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(undefined);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'draft' | 'preview'>('draft');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const result = await api.get(`/api/owner/articles/${id}`);
      setArticle(result.data || {});
      try {
        const parsedBlocks = JSON.parse(result.data.content || '[]');
        setBlocks(parsedBlocks);
      } catch (e) {
        setBlocks([]);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load article', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const triggerAutosave = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    const timer = setTimeout(async () => {
      setAutosaving(true);
      try {
        await api.post(`/api/owner/articles/${id}/autosave`, {
          content: JSON.stringify(blocks),
          meta: article.meta || {},
        });
        toast({ title: 'Autosaved' });
      } catch (error: any) {
        console.error('Autosave error:', error);
      } finally {
        setAutosaving(false);
      }
    }, 5000);
    autosaveTimerRef.current = timer;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/owner/articles/${id}`, {
        content: JSON.stringify(blocks),
        meta: article.meta || {},
      });
      toast({ title: 'Article Saved' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to save article', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/api/owner/articles/publish-now`, {
        articleId: parseInt(id),
        placement: 'home',
        featured: false,
      });
      toast({ title: 'Article Published' });
      await fetchArticle();
      setViewMode('preview');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to publish', description: error.message });
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setBlocks([]);
    template.requiredBlocks.forEach((blockType: string, index: number) => {
      const newBlock: Block = {
        id: Date.now().toString() + index,
        type: blockType as any,
        content: {},
        order: index,
      };
      setBlocks(prev => [...prev, newBlock]);
    });
    setTemplateDialog(false);
    toast({ title: `Template ${template.name} applied` });
  };

  const handleContentUpdate = (delta: any) => {
    if (delta.isStream) return;
    if (delta.type === 'diff' && delta.blockIndex !== undefined) {
      const updated = blocks.map((b, i) => i === delta.blockIndex ? { ...b, content: delta.newContent } : b);
      setBlocks(updated);
    } else if (delta.type === 'append') {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === 'paragraph') {
        const updated = blocks.map((b, i) => i === blocks.length - 1 ? { ...b, content: { ...b.content, text: b.content.text + delta.text } } : b);
        setBlocks(updated);
      }
    }
  };

  const handleApplyDiff = (blockIndex: number, newContent: string) => {
    const updated = blocks.map((b, i) => i === blockIndex ? { ...b, content: newContent } : b);
    setBlocks(updated);
    toast({ title: 'Block Updated' });
  };

  const handleGenerateDraft = async () => {
    try {
      await api.post('/api/owner/articles/generate-draft', {
        articleId: parseInt(id),
        modelId: 1,
      });
      toast({ title: 'Draft Generation Started', description: 'AI is writing your article.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to start draft', description: error.message });
    }
  };

  useEffect(() => {
    fetchArticle();
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    triggerAutosave();
  }, [blocks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <OwnerPageShell title="Edit Article" subtitle={article?.title || 'Loading...'}>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/owner/articles'}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <OwnerPageHeader
          title={article?.title || 'New Article'}
          subtitle={
            <div className="flex items-center gap-2">
              <Badge variant={article?.status === 'PUBLISHED' ? 'default' : 'secondary'}>{article?.status || 'DRAFT'}</Badge>
              {autosaving && (
                <span className="text-xs text-blue-600 animate-pulse">Saving...</span>
              )}
            </div>
          }
          actionLabel="Save"
          actionIcon={<Save className="h-4 w-4" />}
          onAction={handleSave}
          disabled={saving || autosaving}
        />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Input
            value={article?.title || ''}
            onChange={(e) => setArticle({ ...article, title: e.target.value })}
            placeholder="Article Title..."
            className="text-xl font-bold"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('draft')}
          >
            Edit
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateDialog(true)}
          >
            Template
          </Button>
          <Button onClick={handlePublish} size="sm">
            Publish
          </Button>
        </div>
      </div>

      {viewMode === 'draft' ? (
        <div className="flex h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-auto">
            <BlockEditor blocks={blocks} onChange={(newBlocks) => { setBlocks(newBlocks); triggerAutosave(); }} />
          </div>

          <div className="w-96 border-l pl-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">AI Assistant</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setSettingsDialog(true)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AISidePanel
                articleId={parseInt(id)}
                modelId={article?.meta?.modelId}
                onContentUpdate={handleContentUpdate}
                onApplyDiff={handleApplyDiff}
              />
            </div>
            <div className="mt-auto space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleGenerateDraft}>
                <FileText className="h-4 w-4 mr-2" /> Generate Draft
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handlePublish} className="w-full">
                  Publish
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={saving} className="w-full">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)] overflow-auto p-8">
          <div className="max-w-3xl mx-auto bg-background rounded-lg shadow p-8">
            <h1 className="text-4xl font-bold mb-4">{article?.title}</h1>
            {blocks.map((block) => (
              <div key={block.id} className="mb-6">
                {block.type === 'heading' && (
                  <h2 className={`text-${block.content?.level === 1 ? '4xl' : block.content?.level === 2 ? '3xl' : '2xl'} font-bold`}>
                    {block.content?.text}
                  </h2>
                )}
                {block.type === 'paragraph' && (
                  <p className="text-lg leading-7">{block.content?.text}</p>
                )}
                {block.type === 'image' && (
                  <div className="my-4">
                    <img src={block.content?.url} alt={block.content?.alt} className="rounded-lg shadow-md max-w-full" />
                    <p className="text-sm text-muted-foreground mt-1 italic">{block.content?.caption}</p>
                  </div>
                )}
                {block.type === 'quote' && (
                  <blockquote className="border-l-4 border-blue-600 pl-4 italic text-2xl my-8">
                    {block.content?.text}
                  </blockquote>
                )}
                {block.type === 'code' && (
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono my-4"><code>{block.content?.code}</code></pre>
                )}
                {block.type === 'divider' && (
                  <hr className="my-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-semibold">News</h3>
              <p className="text-sm text-muted-foreground">Standard news article with heading, paragraphs, image, quote.</p>
              <Button variant="outline" className="w-full" onClick={() => handleTemplateSelect({ type: 'news', requiredBlocks: ['heading', 'paragraph', 'image', 'quote'], defaultTags: ['news', 'latest'], placement: ['home', 'category'] })}>Apply</Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Deep Analysis</h3>
              <p className="text-sm text-muted-foreground">Long-form analysis with charts, tables, code blocks.</p>
              <Button variant="outline" className="w-full" onClick={() => handleTemplateSelect({ type: 'deep_analysis', requiredBlocks: ['heading', 'paragraph', 'chart', 'code', 'table'], defaultTags: ['analysis', 'deep'], placement: ['topic'] })}>Apply</Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Tutorial</h3>
              <p className="text-sm text-muted-foreground">Step-by-step tutorial with headings, code, CTA.</p>
              <Button variant="outline" className="w-full" onClick={() => handleTemplateSelect({ type: 'tutorial', requiredBlocks: ['heading', 'paragraph', 'code', 'cta'], defaultTags: ['tutorial', 'howto'], placement: ['home', 'topic'] })}>Apply</Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Comparison</h3>
              <p className="text-sm text-muted-foreground">Product comparison with table and pros/cons.</p>
              <Button variant="outline" className="w-full" onClick={() => handleTemplateSelect({ type: 'comparison', requiredBlocks: ['heading', 'paragraph', 'table'], defaultTags: ['review', 'product'], placement: ['category'] })}>Apply</Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Blank</h3>
              <p className="text-sm text-muted-foreground">Start with a blank slate.</p>
              <Button variant="outline" className="w-full" onClick={() => { setBlocks([]); setTemplateDialog(false); }}>Start Blank</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OwnerPageShell>
  );
}
