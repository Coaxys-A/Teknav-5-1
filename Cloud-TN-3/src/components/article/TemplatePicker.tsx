'use client';

import { useState } from 'react';
import { News, FileText, Shield, Book, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TemplateType = 'news' | 'deep_analysis' | 'security_advisory' | 'tutorial' | 'review' | 'comparison';

export interface Template {
  type: TemplateType;
  name: string;
  description: string;
  icon: any;
  requiredBlocks: string[];
  defaultTags: string[];
  placement: string[];
}

const TEMPLATES: Template[] = [
  {
    type: 'news',
    name: 'News',
    description: 'Standard news article with heading, paragraphs, image, quote.',
    icon: News,
    requiredBlocks: ['heading', 'paragraph', 'image'],
    defaultTags: ['news', 'latest'],
    placement: ['home', 'category'],
  },
  {
    type: 'deep_analysis',
    name: 'Deep Analysis',
    description: 'Long-form analysis with charts, tables, code blocks.',
    icon: FileText,
    requiredBlocks: ['heading', 'paragraph', 'chart', 'code'],
    defaultTags: ['analysis', 'deep'],
    placement: ['topic'],
  },
  {
    type: 'security_advisory',
    name: 'Security Advisory',
    description: 'Alert-style with callouts, code, tables.',
    icon: Shield,
    requiredBlocks: ['heading', 'callout', 'code', 'table'],
    defaultTags: ['security', 'advisory'],
    placement: ['category'],
  },
  {
    type: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step tutorial with headings, code, CTA.',
    icon: Book,
    requiredBlocks: ['heading', 'paragraph', 'code', 'cta'],
    defaultTags: ['tutorial', 'howto'],
    placement: ['home', 'topic'],
  },
  {
    type: 'review',
    name: 'Review',
    description: 'Product review with heading, image, chart, CTA.',
    icon: Scale,
    requiredBlocks: ['heading', 'image', 'chart', 'cta'],
    defaultTags: ['review', 'product'],
    placement: ['category'],
  },
];

interface TemplatePickerProps {
  onSelect: (template: Template) => void;
  selected?: Template;
}

export function TemplatePicker({ onSelect, selected }: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {TEMPLATES.map((template) => (
        <Card
          key={template.type}
          className={`cursor-pointer transition-colors ${selected?.type === template.type ? 'border-blue-500' : 'hover:border-blue-500'}`}
          onClick={() => onSelect(template)}
        >
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">{template.name}</CardTitle>
            <template.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {template.description}
            </p>
            <div className="space-y-1">
              <div className="text-xs font-semibold">Required Blocks:</div>
              <div className="flex flex-wrap gap-1">
                {template.requiredBlocks.map((block) => (
                  <span key={block} className="inline-block bg-muted px-2 py-0.5 rounded text-xs">
                    {block}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold">Default Tags:</div>
              <div className="flex flex-wrap gap-1">
                {template.defaultTags.map((tag) => (
                  <span key={tag} className="inline-block bg-muted px-2 py-0.5 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
