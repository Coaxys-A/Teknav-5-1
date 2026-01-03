import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('emails')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async send(@Body() body: { to: string; templateKey: string; context?: Record<string, any> }, @CurrentUser() user: any) {
    return this.email.sendTemplate(body.to, body.templateKey, body.context ?? {}, user?.id);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPref(@CurrentUser() user: any) {
    return this.email.getPreference(user?.id);
  }

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  async setPref(@Body() body: { frequency: string; categories?: string[] }, @CurrentUser() user: any) {
    return this.email.upsertPreference(user?.id, body.frequency ?? 'daily', body.categories ?? []);
  }
}
