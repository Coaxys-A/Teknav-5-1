import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PoliciesGuard } from '../../security/policies.guard';
import { RequirePolicy } from '../../security/policy.decorator';
import { AuditLogService } from '../../logging/audit-log.service';
import { SessionService } from '../../security/session.service';
import { AuthContextService } from '../../auth/auth-context.service';

@Controller('owner/tenants')
@UseGuards(PoliciesGuard)
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(
    private readonly service: TenantsService,
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
      targetType: 'TenantList',
      targetId: 0,
      metadata: query,
    });

    return await this.service.findAll(query);
  }

  @Get(':id')
  @RequirePolicy('read', 'Tenant')
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
      targetType: 'Tenant',
      targetId: parseInt(id),
      metadata: {},
    });

    return await this.service.findOne(parseInt(id));
  }

  @Post()
  @RequirePolicy('create', 'Tenant')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: any,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.create(data);

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.tenant.create',
      resource: 'Tenant',
      payload: data,
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Patch(':id')
  @RequirePolicy('update', 'Tenant')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.update(parseInt(id), data);

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.tenant.update',
      resource: 'Tenant',
      payload: { id, diff: data },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Patch(':id/domains')
  @RequirePolicy('update', 'Tenant')
  @HttpCode(HttpStatus.OK)
  async updateDomains(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.updateDomains(parseInt(id), data);

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.tenant.domains.update',
      resource: 'Tenant',
      payload: { id, diff: data },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Post(':id/restore')
  @RequirePolicy('update', 'Tenant')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.restore(parseInt(id));

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.tenant.restore',
      resource: 'Tenant',
      payload: { id },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }

  @Delete(':id')
  @RequirePolicy('delete', 'Tenant')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const authCtx = await this.authContext.getContext(req);
    const result = await this.service.softDelete(parseInt(id));

    // Log action
    await this.auditLog.logAction({
      actorId: authCtx.userId,
      action: 'owner.tenant.delete',
      resource: 'Tenant',
      payload: { id },
      ip: authCtx.ip,
      ua: authCtx.ua,
    });

    return result;
  }
}
  }
}
