import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER, Role.MANAGER)
  list() {
    return this.tagsService.list();
  }

  @Post()
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER, Role.MANAGER)
  create(@Body('name') name: string, @CurrentUser() user: any) {
    return this.tagsService.create(name, user?.id);
  }

  @Put(':id')
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER, Role.MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string }, @CurrentUser() user: any) {
    return this.tagsService.update(id, body, user?.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.tagsService.remove(id, user?.id);
  }
}
