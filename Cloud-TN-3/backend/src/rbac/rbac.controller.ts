import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { Permission } from './permission.decorator';
import { PermissionGuard } from './permission.guard';

@Controller('rbac')
@UseGuards(PermissionGuard)
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('roles')
  @Permission({ resource: 'rbac', action: 'read', scope: 'global' })
  listRoles() {
    return this.rbac.listRoles();
  }

  @Post('roles')
  @Permission({ resource: 'rbac', action: 'manage', scope: 'global' })
  upsertRole(@Body() body: SetPermissionsDto) {
    // roles are static; this endpoint only refreshes cache
    return { ok: true };
  }

  @Post('assignments')
  @Permission({ resource: 'rbac', action: 'manage', scope: 'tenant' })
  assign(@Body() body: AssignRoleDto) {
    return this.rbac.assignRole(body);
  }

  @Get('effective/:userId')
  @Permission({ resource: 'rbac', action: 'read', scope: 'tenant' })
  effective(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('tenantId') tenantId?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.rbac.getEffectivePermissions(userId, tenantId ? Number(tenantId) : null, workspaceId ? Number(workspaceId) : null);
  }

  @Post('flush/:userId')
  @Permission({ resource: 'rbac', action: 'manage', scope: 'global' })
  flush(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('tenantId') tenantId?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.rbac.flushPermissionCache(userId, tenantId ? Number(tenantId) : null, workspaceId ? Number(workspaceId) : null);
  }

  @Post('flush-all/:userId')
  @Permission({ resource: 'rbac', action: 'manage', scope: 'global' })
  flushAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.rbac.flushAllUserPermissions(userId);
  }
}
