import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('unread')
  async unread(@CurrentUser() user: any) {
    return this.notifications.list(user?.id, true);
  }

  @Get('all')
  async all(@CurrentUser() user: any) {
    return this.notifications.list(user?.id, false);
  }

  @Patch(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notifications.markRead(id, user?.id);
  }
}
