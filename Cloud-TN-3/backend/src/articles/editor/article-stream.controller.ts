import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UseGuards, Req, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AiService } from '../../../ai/ai.service';
import { AuditLogService } from '../../../logging/audit-log.service';
import { PolicyService, Action, Resource } from '../../../auth/policy/policy.service';
import { PoliciesGuard } from '../../../auth/policy/policies.guard';
import { RequirePolicy } from '../../../auth/policy/policy.decorator';

interface AiChatRequest {
  articleId: number;
  message: string;
  modelId?: number;
  blockIndex?: number;
  action?: string;
}

@Controller('owner/articles/editor')
@UseGuards(PoliciesGuard)
export class ArticleStreamController {
  constructor(
    private readonly aiService: AiService,
    private readonly auditLog: AuditLogService,
    private readonly policyService: PolicyService,
  ) {}

  @Post('stream-ai-chat')
  @RequirePolicy(Action.EXECUTE, Resource.AI)
  @Headers('Content-Type', 'application/json')
  @Sse({ messageEvent: 'data' })
  async streamAiChat(@Body() body: AiChatRequest, @Req() req: any): Promise<Observable<any>> {
    const actorId = req.user?.id;

    await this.auditLog.logAction({
      actorId,
      action: 'ai.chat.started',
      resource: 'Article',
      payload: { articleId: body.articleId, message: body.message },
      ip: req.ip,
      ua: req.ua,
    });

    return new Observable<any>((subscriber) => {
      let fullResponse = '';

      const processChunk = (chunk: string) => {
        const delta = { delta: chunk };
        subscriber.next({ type: 'chunk', data: delta });
        fullResponse += chunk;
      };

      const sendEnd = () => {
        subscriber.next({ type: 'end', data: { finalContent: fullResponse } });
        subscriber.complete();
      };

      setTimeout(async () => {
        try {
          if (body.action === 'rewrite') {
            await this.aiService.generateContent({
              tenantId: 1,
              workspaceId: 1,
              articleId: body.articleId,
              promptTemplateKey: 'rewrite',
            }).then(res => {
              processChunk(JSON.stringify(res));
              sendEnd();
            }).catch(err => {
              subscriber.error(err);
            });
          } else if (body.action === 'summarize') {
             processChunk('Summary: ' + body.message + '\n');
             sendEnd();
          } else {
             processChunk('AI: ' + body.message + '\n');
             sendEnd();
          }
        } catch (error: any) {
          subscriber.error(error);
        }
      }, 100);

      return () => {};
    });
  }
}
