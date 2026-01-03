import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RAG (Retrieval-Augmented Generation) Service for Chat with News
 * 
 * Simple implementation:
 * 1. Fetch article content
 * 2. Build context (title, content, tags)
 * 3. Call AI API with user query + context
 * 4. Return answer
 */

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ask question about an article
   */
  async askAboutArticle(articleId: number, question: string) {
    this.logger.debug(`Asking question about article ${articleId}`);

    try {
      // Fetch article
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          mainKeyword: true,
        },
      });

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      // Build context (simple string concatenation)
      // In production, use embeddings/chunking for better RAG
      const context = `
        Article Title: ${article.title}
        Main Keyword: ${article.mainKeyword || 'N/A'}
        Tags: ${article.tags ? JSON.stringify(article.tags) : 'N/A'}
        Content: ${article.content?.substring(0, 2000)}...
      `.trim();

      // Call AI (mocked here for minimal implementation)
      // In production, use OpenRouter/LLM with context
      const aiResponse = await this.callAI(question, context);

      return {
        question,
        answer: aiResponse.answer,
        context: context,
      };

    } catch (error: any) {
      this.logger.error(`Failed to answer question about article ${articleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Call AI API (OpenRouter)
   */
  private async callAI(question: string, context: string): Promise<{ answer: string }> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      // Return mock response if no API key
      return {
        answer: `Mock AI Response: Based on the article, here's what I found regarding "${question}"... (Configure OPENROUTER_API_KEY in .env for real responses)`,
      };
    }

    // In production, make actual API call
    // For now, return mock response
    return {
      answer: `Based on the article, here's what I found regarding "${question}"... (AI API call would be made here)`,
    };
  }
}
