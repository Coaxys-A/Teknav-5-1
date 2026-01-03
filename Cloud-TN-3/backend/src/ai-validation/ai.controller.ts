import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiValidationService } from './ai-validation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { ValidateContentDto } from './dto/validate-content.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard, RateLimitGuard)
export class AiController {
  constructor(private readonly aiService: AiValidationService) {}

  @Post('validate')
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async validate(@Body() body: ValidateContentDto) {
    return this.aiService.analyzeArticle(body.content);
  }
}
