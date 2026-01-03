import { Controller, Get, Query, Patch, Body, Post, UploadedFile, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Express } from 'express';
import { AiRuntimeService } from '../ai/ai-runtime.service';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly aiRuntime: AiRuntimeService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const saved = await this.mediaService.saveFile(file, req.user?.id);
    return { ok: true, file: saved };
  }

  @Get('list')
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async list(@Query('search') search?: string, @Query('folder') folder?: string) {
    return this.mediaService.list(search, folder);
  }

  @Patch(':id/meta')
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async updateMeta(@Req() req: any, @Body() body: { alt?: string; caption?: string; folder?: string }) {
    return this.mediaService.updateMeta(Number(req.params.id), body);
  }

  @Post('alt')
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async generateAlt(@Body() body: { description?: string; prompt?: string }) {
    const res = await this.aiRuntime.runAgent({
      agentId: Number(process.env.DEFAULT_ALT_AGENT_ID ?? 0),
      input: { task: 'alt', description: body.description, prompt: body.prompt },
    });
    return { alt: (res as any)?.output ?? body.description ?? 'تصویر' };
  }

  @Post('caption')
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async generateCaption(@Body() body: { description?: string }) {
    const res = await this.aiRuntime.runAgent({
      agentId: Number(process.env.DEFAULT_ALT_AGENT_ID ?? 0),
      input: { task: 'caption', description: body.description },
    });
    return { caption: (res as any)?.output ?? body.description ?? '' };
  }
}
