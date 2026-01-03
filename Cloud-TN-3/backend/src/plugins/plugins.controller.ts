import { Body, Controller, Get, Param, ParseBoolPipe, Post, Query, UseGuards, Req } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PluginExecutorService } from './plugin-executor.service';
import { PluginEventDispatcherService } from './plugin-event-dispatcher.service';

@Controller('plugins')
export class PluginsController {
  constructor(
    private readonly plugins: PluginsService,
    private readonly executor: PluginExecutorService,
    private readonly events: PluginEventDispatcherService,
  ) {}

  @Get()
  async listPublic(@Query('slot') slot?: string, @Req() req?: any) {
    return this.plugins.list(slot || undefined, req?.tenantId ?? null);
  }

  @Get('marketplace')
  async marketplace() {
    return this.plugins.marketplace();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async adminList(@Req() req: any) {
    return this.plugins.adminList(req.tenantId ?? null);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async upsert(@Body() body: any, @Req() req: any) {
    return this.plugins.upsert({ ...body, tenantId: req.tenantId ?? null });
  }

  @Post(':key/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async toggle(@Param('key') key: string, @Query('enabled', ParseBoolPipe) enabled: boolean) {
    return this.plugins.toggle(key, enabled);
  }

  @Post(':key/install')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async install(@Param('key') key: string, @Body() body: any, @Req() req: any) {
    if (!req.tenantId) throw new Error('TENANT_REQUIRED');
    return this.plugins.install(req.tenantId, key, body?.configuration);
  }

  @Post(':key/uninstall')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async uninstall(@Param('key') key: string, @Req() req: any) {
    if (!req.tenantId) throw new Error('TENANT_REQUIRED');
    return this.plugins.uninstall(req.tenantId, key);
  }

  @Get(':key/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async versions(@Param('key') key: string) {
    return this.plugins.listVersions(key);
  }

  @Post(':key/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async publishVersion(@Param('key') key: string, @Body() body: any) {
    return this.plugins.publishVersion(key, body);
  }

  @Post(':key/run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async run(@Param('key') key: string, @Body() body: any, @Req() req: any) {
    return this.executor.runPlugin({
      pluginKey: key,
      tenantId: req.tenantId ?? null,
      payload: body?.payload ?? {},
    });
  }

  @Post('events/dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async dispatchEvent(@Body() body: any, @Req() req: any) {
    return this.events.dispatch(body.event, body.payload ?? {}, req?.tenantId ?? null, req?.workspaceId ?? null);
  }

  @Get('installed/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async installed(@Req() req: any) {
    if (!req.tenantId) throw new Error('TENANT_REQUIRED');
    return this.plugins.installed(req.tenantId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async logs(@Req() req: any) {
    return this.plugins.logs(req?.tenantId ?? null);
  }
}
