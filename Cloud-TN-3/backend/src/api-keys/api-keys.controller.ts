import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Post('create')
  @Roles(Role.ADMIN, Role.OWNER)
  async create(
    @Body('name') name: string,
    @Body('scopes') scopes: string[],
    @Body('rateLimit') rateLimit: number | undefined,
    @CurrentUser() user: any,
  ) {
    return this.service.create(name, user?.id, scopes ?? [], rateLimit ?? 1000);
  }

  @Post('revoke')
  @Roles(Role.ADMIN, Role.OWNER)
  async revoke(@Body('id') id: number) {
    return this.service.revoke(Number(id));
  }
}
