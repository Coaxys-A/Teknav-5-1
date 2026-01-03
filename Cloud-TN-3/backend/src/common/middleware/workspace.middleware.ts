import { Injectable, NestMiddleware } from '@nestjs/common';
import { WorkspaceService } from '../../workspace/workspace.service';

@Injectable()
export class WorkspaceMiddleware implements NestMiddleware {
  constructor(private readonly workspaces: WorkspaceService) {}

  async use(req: any, res: any, next: () => void) {
    const headerId = req.headers['x-workspace-id'] as string | undefined;
    const host = req.headers['host'] as string | undefined;
    const tenantId: number | null = req.tenantId ?? null;
    const workspaceId = await this.workspaces.resolveWorkspace(host, headerId, tenantId);
    req.workspaceId = workspaceId;
    next();
  }
}
