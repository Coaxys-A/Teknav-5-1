import { Controller, Post, Body, Param, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('articles')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  /**
   * Ask question about an article (RAG)
   */
  @Post(':id/chat')
  @HttpCode(HttpStatus.OK)
  async chatWithArticle(
    @Param('id') id: string,
    @Body() body: { question: string },
  ) {
    const result = await this.ragService.askAboutArticle(
      parseInt(id),
      body.question,
    );

    return { data: result };
  }
}
