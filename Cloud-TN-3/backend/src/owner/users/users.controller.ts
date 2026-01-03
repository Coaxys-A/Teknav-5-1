import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { PoliciesGuard } from '../../security/policies.guard';
import { RequirePolicy } from '../../security/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { SessionService } from '../../security/session.service';
import { AuthContextService } from '../../auth/auth-context.service';

@Controller('owner/users')
@UseGuards(PoliciesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly service: UsersService,
    private readonly auditLog: AuditLogService,
    private readonly sessionService: SessionService,
    private readonly authContext: AuthContextService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: any,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);

    // Log sensitive read
    await this.auditLog.logDataAccess({
      actorUserId: authCtx.userId,
      action: 'read_sensitive',
      targetType: 'UserList',
      targetId: 0,
      metadata: query,
    });

    return await this.service.findAll(query);
  }

  @Get(':id')
  @RequirePolicy('read', 'User')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);

    // Log sensitive read
    await this.auditLog.logDataAccess({
      actorUserId: authCtx.userId,
      action: 'read_sensitive',
      targetType: 'User',
      targetId: parseInt(id),
      metadata: {},
    });

    return await this.service.findOne(parseInt(id));
  }

  @Patch(':id/role')
  @RequirePolicy('update', 'User', 'self')
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.updateRole(parseInt(id), body.role);

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.user.role.update',
      resource: 'User',
      payload: { id, role: body.role },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Patch(':id/ban')
  @RequirePolicy('update', 'User')
  @HttpCode(HttpStatus.OK)
  async ban(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.ban(parseInt(id), authCtx.ip, 'Admin banned');

    // Revoke sessions
    await this.sessionService.revokeUserSessions(parseInt(id));

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.user.ban',
      resource: 'User',
      payload: { id },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Patch(':id/unban')
  @RequirePolicy('update', 'User')
  @HttpCode(HttpStatus.OK)
  async unban(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.unban(parseInt(id));

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.user.unban',
      resource: 'User',
      payload: { id },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Post(':id/reset-password')
  @RequirePolicy('update', 'User')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.resetPassword(parseInt(id));

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.user.password.reset',
      resource: 'User',
      payload: { id },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Get(':id/audit-logs')
  @RequirePolicy('read', 'User')
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(
    @Param('id') id: string,
    @Query() params: any,
  ) {
    return await this.service.getAuditLogs(parseInt(id), params);
  }

  @Get(':id/sessions')
  @RequirePolicy('read', 'User')
  @HttpCode(HttpStatus.OK)
  async getSessions(
    @Param('id') id: string,
    @Query() params: any,
  ) {
    return await this.service.getSessions(parseInt(id), params);
  }
}
  }
}
