import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TenantContextStorage } from '../context/tenant-context.storage';
import { TenantContextData } from '../context/tenant-context.interface';
import { JwtPayload } from '../../auth/auth.interface';

export interface RequestWithTenantContext extends Request {
  tenantContext?: TenantContextData;
  activeBranchId?: string;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  use(req: RequestWithTenantContext, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const requestedBranchId = req.headers['x-branch-id'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Unauthenticated request, proceed without tenant context
      return next();
    }

    const token = authHeader.split(' ')[1];
    const secret =
      this.configService.get<string>('auth.jwtSecret') ||
      'default-super-secret-jwt-key-minimum-32-chars';

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      if (!payload.tenantId || !payload.sub) {
        return next();
      }

      const isSuperAdmin = payload.role === 'SUPER_ADMIN';
      const isOwner = payload.role === 'TENANT_OWNER' || payload.role === 'TENANT_ADMIN';
      const allowedBranchIds = payload.branchIds || [];

      // Validate Branch Access if x-branch-id header is sent
      let activeBranchId = requestedBranchId;
      if (requestedBranchId) {
        const hasAccess =
          isSuperAdmin || allowedBranchIds.includes(requestedBranchId);

        if (!hasAccess) {
          throw new ForbiddenException(
            `Access denied: You do not have permission to operate in branch '${requestedBranchId}'`
          );
        }
      } else if (allowedBranchIds.length > 0) {
        // Default to first allowed branch
        activeBranchId = allowedBranchIds[0];
      }

      const contextData: TenantContextData = {
        tenantId: payload.tenantId,
        userId: payload.sub,
        userRole: payload.role,
        activeBranchId,
        allowedBranchIds,
        isSuperAdmin,
      };

      req.tenantContext = contextData;
      req.activeBranchId = activeBranchId;

      // Wrap downstream handling inside AsyncLocalStorage
      return TenantContextStorage.run(contextData, () => next());
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      // If token expired or invalid, let auth guard handle standard 401
      return next();
    }
  }
}
