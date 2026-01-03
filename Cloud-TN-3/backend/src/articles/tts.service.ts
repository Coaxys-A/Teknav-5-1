import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Text-to-Speech (TTS) Service for Audio Articles
 * 
 * Uses OpenRouter/ElevenLabs API configured in .env
 */

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate audio for an article
   */
  async generateArticleAudio(articleId: number) {
    this.logger.debug(`Generating audio for article ${articleId}`);

    try {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          content: true,
          localeId: true,
        },
      });

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      // In production, call AI TTS API
      // For now, return mock response
      const ttsKey = process.env.OPENROUTER_TTS_API_KEY;

      if (!ttsKey) {
        return {
          audioUrl: null,
          text: article.content?.substring(0, 100) + '... (No TTS API Key)',
        };
      }

      // Mock TTS generation
      return {
        audioUrl: `https://cdn.example.com/audio/${articleId}.mp3`,
        text: article.content,
      };

    } catch (error: any) {
      this.logger.error(`Failed to generate audio for article ${articleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get audio for an article (cached)
   */
  async getArticleAudio(articleId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, audioUrl: true, updatedAt: true },
    });

    return {
      articleId,
      audioUrl: article?.audioUrl,
      hasAudio: !!article?.audioUrl,
    };
  }
}
