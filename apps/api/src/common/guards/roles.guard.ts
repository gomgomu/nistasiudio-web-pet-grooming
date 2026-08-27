import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedUser } from '../../auth/auth.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User is not authenticated or has no assigned role');
    }

    // Super Admin has unrestricted access to all endpoints
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Tenant Owner has access to all tenant-scoped roles (Owner, Admin, Manager, Staff, etc.)
    if (
      user.role === UserRole.TENANT_OWNER &&
      !requiredRoles.includes(UserRole.SUPER_ADMIN)
    ) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Role '${user.role}' is not authorized to access this resource`
      );
    }

    return true;
  }
}
