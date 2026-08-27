import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextStorage } from '../context/tenant-context.storage';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Prefer authenticated request user tenantId or AsyncLocalStorage
    return request.user?.tenantId || TenantContextStorage.getTenantId();
  }
);
