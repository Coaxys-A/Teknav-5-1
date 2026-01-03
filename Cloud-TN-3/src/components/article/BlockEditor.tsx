'use client';

import { useState, useRef } from 'react';
import { Plus, GripVertical, Trash, ChevronUp, ChevronDown, Image, Code, Table, PieChart, MessageSquare, Quote, Separator, Check, List, Bold, Italic, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type BlockType = 'heading' | 'paragraph' | 'image' | 'gallery' | 'quote' | 'callout' | 'table' | 'code' | 'chart' | 'embed' | 'divider' | 'cta' | 'list';

export interface Block {
  id: string;
  type: BlockType;
  content?: any;
  order: number;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      order: blocks.length,
      content: getDefaultContent(type),
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: any) => {
    const updated = blocks.map(b => b.id === id ? { ...b, content } : b);
    onChange(updated);
  };

  const removeBlock = (id: string) => {
    const filtered = blocks.filter(b => b.id !== id);
    onChange(filtered);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const reordered = [...blocks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, moved);
    onChange(reordered.map((b, i) => ({ ...b, order: i })));
  };

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 overflow-auto space-y-4">
        {blocks.map((block, index) => (
          <BlockComponent
            key={block.id}
            block={block}
            index={index}
            onUpdate={(content) => updateBlock(block.id, content)}
            onRemove={() => removeBlock(block.id)}
            onMove={(toIndex) => moveBlock(index, toIndex)}
            isHovered={hoveredBlock === block.id}
            onHover={() => setHoveredBlock(block.id)}
            onLeave={() => setHoveredBlock(null)}
            onMoveUp={() => moveBlock(index, index - 1)}
            onMoveDown={() => moveBlock(index, index + 1)}
          />
        ))}
        {blocks.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">No blocks yet</p>
              <p className="text-sm">Select a template or add a block to get started.</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-72 space-y-4 h-fit">
        <div className="sticky top-4 space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Block</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {getAvailableBlocks().map((group, i) => (
                <div key={i} className="space-y-1 pb-2 border-b last:border-0">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">{group.group}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {group.blocks.map((block) => (
                      <Button
                        key={block.type}
                        variant="outline"
                        size="sm"
                        className="justify-start h-9"
                        onClick={() => addBlock(block.type as BlockType)}
                      >
                        {block.icon}
                        <span className="ml-2">{block.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BlockComponent({ block, index, onUpdate, onRemove, onMove, isHovered, onHover, onLeave, onMoveUp, onMoveDown }: any) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all ${isHovered ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">{block.type}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0} title="Move Up">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={index === blocks.length - 1} title="Move Down">
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} title="Edit Settings">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mb-3 p-2 bg-muted/30 rounded space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">Alignment</span>
            <Select value={block.content?.align || 'left'} onValueChange={(v) => onUpdate({ ...block.content, align: v })}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Left" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Animation</span>
            <Select value={block.content?.animation || 'none'} onValueChange={(v) => onUpdate({ ...block.content, animation: v })}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <BlockContentRenderer block={block} onChange={onUpdate} />
    </div>
  );
}

function getAvailableBlocks() {
  return [
    {
      group: 'Text',
      blocks: [
        { type: 'heading', name: 'Heading', icon: <h1 className="h-4 w-4 font-bold" /> },
        { type: 'paragraph', name: 'Paragraph', icon: <MessageSquare className="h-4 w-4" /> },
        { type: 'list', name: 'List', icon: <List className="h-4 w-4" /> },
        { type: 'quote', name: 'Quote', icon: <Quote className="h-4 w-4" /> },
      ],
    },
    {
      group: 'Media',
      blocks: [
        { type: 'image', name: 'Image', icon: <Image className="h-4 w-4" /> },
        { type: 'gallery', name: 'Gallery', icon: <Image className="h-4 w-4" /> },
        { type: 'chart', name: 'Chart', icon: <PieChart className="h-4 w-4" /> },
      ],
    },
    {
      group: 'Rich',
      blocks: [
        { type: 'callout', name: 'Callout', icon: <Check className="h-4 w-4" /> },
        { type: 'cta', name: 'CTA', icon: <Check className="h-4 w-4" /> },
        { type: 'divider', name: 'Divider', icon: <Separator className="h-4 w-4" /> },
      ],
    },
    {
      group: 'Code',
      blocks: [
        { type: 'code', name: 'Code', icon: <Code className="h-4 w-4" /> },
        { type: 'embed', name: 'Embed', icon: <Code className="h-4 w-4" /> },
      ],
    },
  ];
}

function BlockContentRenderer({ block, onChange }: any) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onUpdate({ ...block.content, level: Math.max(1, (block.content?.level || 1) - 1) })}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground">H{block.content?.level || 1}</span>
            <Button variant="ghost" size="icon" onClick={() => onUpdate({ ...block.content, level: (block.content?.level || 1) + 1 })}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={block.content?.text || ''}
            onChange={(e) => onChange({ ...block.content, text: e.target.value })}
            placeholder="Heading text..."
            className={`font-bold ${block.content?.level === 1 ? 'text-2xl' : block.content?.level === 2 ? 'text-xl' : block.content?.level === 3 ? 'text-lg' : 'text-base'}`}
          />
          <div className="flex gap-2">
            <Toggle pressed={block.content?.bold} onPressedChange={(p) => onUpdate({ ...block.content, bold: p })}>
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle pressed={block.content?.italic} onPressedChange={(p) => onUpdate({ ...block.content, italic: p })}>
              <Italic className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      );
    case 'paragraph':
      return (
        <Textarea
          value={block.content?.text || ''}
          onChange={(e) => onChange({ ...block.content, text: e.target.value })}
          placeholder="Write your paragraph..."
          rows={4}
          className="resize-none"
        />
      );
    case 'list':
      return (
        <div className="space-y-2">
          <Textarea
            value={block.content?.items?.join('\n') || ''}
            onChange={(e) => onChange({ ...block.content, items: e.target.value.split('\n') })}
            placeholder="- Item 1\n- Item 2"
            rows={4}
          />
          <Select value={block.content?.listType || 'bullet'} onValueChange={(v) => onChange({ ...block.content, listType: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullet">Bullet</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2">
          <Input
            value={block.content?.url || ''}
            onChange={(e) => onChange({ ...block.content, url: e.target.value })}
            placeholder="https://..."
          />
          <Input
            value={block.content?.alt || ''}
            onChange={(e) => onChange({ ...block.content, alt: e.target.value })}
            placeholder="Alt text..."
          />
          <Input
            value={block.content?.caption || ''}
            onChange={(e) => onChange({ ...block.content, caption: e.target.value })}
            placeholder="Caption..."
          />
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => {
            const items = prompt('Enter image URLs (one per line):');
            if (items) onChange({ ...block.content, images: items.split('\n') });
          }}>
            Add Images
          </Button>
          {block.content?.images && (
            <div className="grid grid-cols-3 gap-2">
              {block.content.images.map((url: string, i: number) => (
                <div key={i} className="aspect-square bg-muted/30 rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground truncate p-1">{url}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case 'callout':
      return (
        <Textarea
          value={block.content?.text || ''}
          onChange={(e) => onChange({ ...block.content, text: e.target.value })}
          placeholder="Callout text (e.g., Note, Warning, Tip)..."
          rows={3}
          className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
        />
      );
    case 'code':
      return (
        <div className="space-y-2">
          <Textarea
            value={block.content?.code || ''}
            onChange={(e) => onChange({ ...block.content, code: e.target.value })}
            placeholder="// Paste code here"
            rows={6}
            className="font-mono text-sm bg-muted/20 rounded"
          />
        </div>
      );
    case 'chart':
      return (
        <div className="space-y-2">
          <Input
            value={block.content?.title || ''}
            onChange={(e) => onChange({ ...block.content, title: e.target.value })}
            placeholder="Chart Title"
          />
          <Textarea
            value={block.content?.dataset || ''}
            onChange={(e) => onChange({ ...block.content, dataset: e.target.value })}
            placeholder="Dataset (CSV or JSON)"
            rows={4}
          />
        </div>
      );
    case 'embed':
      return (
        <Textarea
          value={block.content?.html || ''}
          onChange={(e) => onChange({ ...block.content, html: e.target.value })}
          placeholder="<iframe ...></iframe>"
          rows={3}
          className="font-mono text-sm"
        />
      );
    case 'divider':
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs text-muted-foreground">Divider</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>
      );
    default:
      return <div className="p-4 text-sm text-muted-foreground">Block editor for {block.type} coming soon.</div>;
  }
}

function getDefaultContent(type: BlockType): any {
  switch (type) {
    case 'heading':
      return { text: '', level: 1, bold: false, italic: false, align: 'left' };
    case 'paragraph':
      return { text: '' };
    case 'list':
      return { items: '', listType: 'bullet' };
    case 'quote':
      return { text: '', author: '' };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'gallery':
      return { images: [] };
    case 'callout':
      return { text: '', type: 'info' };
    case 'code':
      return { code: '', language: 'javascript' };
    case 'chart':
      return { title: '', dataset: '', type: 'bar' };
    case 'embed':
      return { html: '' };
    case 'divider':
      return {};
    default:
      return {};
  }
}
