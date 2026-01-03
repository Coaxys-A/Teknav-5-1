import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  if (request?.user) {
    return request.user;
  }
  const graphqlContext = ctx.getArgByIndex?.(2);
  return graphqlContext?.req?.user;
});
