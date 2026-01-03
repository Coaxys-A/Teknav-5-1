import { Injectable } from '@nestjs/common';

@Injectable()
export class SeoService {
  estimateReadingTime(content: string) {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  calcReadability(content: string) {
    const sentences = content.split(/[.!؟\n]/).filter((s) => s.trim().length > 0);
    const words = content.trim().split(/\s+/).filter(Boolean);
    if (!sentences.length || !words.length) return 0;
    const avgWordsPerSentence = words.length / sentences.length;
    const penalty = Math.max(0, avgWordsPerSentence - 20) * 0.02;
    const base = Math.max(0, Math.min(1, 1 - penalty));
    return Math.round(base * 100);
  }

  calcSeoScore(params: {
    content: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    mainKeyword?: string | null;
  }) {
    let score = 50;
    const { content, metaTitle, metaDescription, mainKeyword } = params;
    const len = content.length;
    if (len > 500 && len < 12000) score += 10;
    if (metaTitle && metaTitle.length >= 30 && metaTitle.length <= 70) score += 5;
    if (metaDescription && metaDescription.length >= 80 && metaDescription.length <= 160) score += 5;
    if (mainKeyword) {
      const freq = (content.toLowerCase().match(new RegExp(mainKeyword.toLowerCase(), 'g')) || []).length;
      if (freq >= 2) score += 5;
    }
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}
