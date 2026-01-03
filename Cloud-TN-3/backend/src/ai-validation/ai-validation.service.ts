import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AiResult {
  originalityScore: number | null;
  seoScore: number | null;
  structureValid: boolean | null;
  aiProbability: number | null;
  feedback: string;
  modelUsed: string;
  raw: string;
}

@Injectable()
export class AiValidationService {
  private readonly logger = new Logger(AiValidationService.name);
  private readonly apiUrl: string;
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('ai.apiUrl')!;
    this.apiKey = this.configService.get<string>('ai.apiKey') ?? undefined;
    this.model = this.configService.get<string>('ai.model') ?? 'deepseek/deepseek-r1-0528:free';
  }

  private clamp(value: any, min: number, max: number) {
    const num = Number(value);
    if (Number.isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  private extractJson(text: string) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('NO_JSON_FOUND');
    }
    const raw = text.slice(start, end + 1);
    return JSON.parse(raw);
  }

  private buildPrompt(content: string) {
    return `
شما یک ویراستار و تحلیلگر حرفه‌ای فارسی هستید.
مقاله زیر را از نظر ساختار، سئو، وضوح، اصالت و احتمال تولید توسط هوش مصنوعی بررسی کن.
در پایان فقط و فقط یک JSON معتبر برگردان (هیچ متن دیگری ننویس):
{
  "originality": number (0..100),
  "seo_score": number (0..1),
  "structure_valid": boolean,
  "ai_probability": number (0..100),
  "feedback": "string"
}

مقاله:
${content}
`.trim();
  }

  async analyzeArticle(content: string): Promise<AiResult> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not configured; returning neutral scores');
      return {
        originalityScore: null,
        seoScore: null,
        structureValid: null,
        aiProbability: null,
        feedback: 'AI validation غیرفعال است.',
        modelUsed: this.model,
        raw: '',
      };
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a content analysis assistant.' },
            { role: 'user', content: this.buildPrompt(content) },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const raw = response.data?.choices?.[0]?.message?.content ?? '';
      const json = this.extractJson(raw);
      return {
        originalityScore: this.clamp(json.originality, 0, 100),
        seoScore: this.clamp(json.seo_score, 0, 1),
        structureValid: Boolean(json.structure_valid),
        aiProbability: this.clamp(json.ai_probability, 0, 100),
        feedback: String(json.feedback ?? ''),
        modelUsed: this.model,
        raw,
      };
    } catch (error) {
      this.logger.error('AI validation failed', error as Error);
      throw new HttpException('AI_VALIDATION_FAILED', HttpStatus.BAD_GATEWAY);
    }
  }
}
