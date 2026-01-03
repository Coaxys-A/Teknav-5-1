import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Role, WorkspaceRole } from '@prisma/client';

export class AssignRoleDto {
  @IsInt()
  userId: number;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  workspaceRole?: WorkspaceRole;

  @IsOptional()
  @IsInt()
  tenantId?: number;

  @IsOptional()
  @IsInt()
  workspaceId?: number;
}
