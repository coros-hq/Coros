import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@org/shared-types';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
