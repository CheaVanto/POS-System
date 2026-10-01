import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Principal } from '../auth/principal';

export const CurrentUser = createParamDecorator(
  (data: keyof Principal | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: Principal = request.user;
    return data ? user?.[data] : user;
  },
);
