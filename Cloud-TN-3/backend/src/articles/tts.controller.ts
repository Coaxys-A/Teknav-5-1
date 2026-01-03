import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TtsService } from './tts.service';

@Controller('articles')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  /**
   * Generate audio for an article (TTS)
   */
  @Post(':id/tts')
  @HttpCode(HttpStatus.OK)
  async generateAudio(
    @Param('id') id: string,
  ) {
    const result = await this.ttsService.generateArticleAudio(parseInt(id));
    return { data: result };
  }

  /**
   * Get audio for an article
   */
  @Get(':id/audio')
  @HttpCode(HttpStatus.OK)
  async getAudio(
    @Param('id') id: string,
  ) {
    const result = await this.ttsService.getArticleAudio(parseInt(id));
    return { data: result };
  }
}
