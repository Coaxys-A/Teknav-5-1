import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PublishService } from './publish.service';

@Controller('owner/publish')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  publish(@Body() body: { id: number; title: string; content: string; slug?: string; meta?: any }) {
    return this.publishService.publish(body);
  }
}
