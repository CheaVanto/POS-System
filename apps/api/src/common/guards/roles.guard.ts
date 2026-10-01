import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Principal } from '../auth/principal';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !requiredPerms?.length) return true;

    const user: Principal | undefined = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('Missing authenticated principal');

    if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('COMPANY_ADMIN')) {
      return true;
    }

    if (requiredRoles?.length) {
      const ok = requiredRoles.some((r) => user.roles.includes(r));
      if (!ok) throw new ForbiddenException('Insufficient role');
    }

    if (requiredPerms?.length) {
      const ok = requiredPerms.every((p) => user.permissions.includes(p));
      if (!ok) throw new ForbiddenException('Insufficient permission');
    }

    return true;
  }
}
