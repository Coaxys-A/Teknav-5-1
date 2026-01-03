import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER, Role.MANAGER)
  list() {
    return this.categoriesService.list();
  }

  @Post()
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER, Role.MANAGER)
  create(@Body('name') name: string, @Body('description') description: string, @CurrentUser() user: any) {
    return this.categoriesService.create(name, description, user?.id);
  }

  @Put(':id')
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER, Role.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.categoriesService.update(id, body, user?.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.categoriesService.remove(id, user?.id);
  }
}
