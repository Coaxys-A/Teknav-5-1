import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceService } from '../../workspace/workspace.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspaces: WorkspaceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const workspaceId: number | null = req.workspaceId ?? null;
    const userId: number | undefined = req.user?.id;
    await this.workspaces.assertMember(userId, workspaceId);
    if (workspaceId) {
      req.workspaceId = workspaceId;
    }
    return true;
  }
}
