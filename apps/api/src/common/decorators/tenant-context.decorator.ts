import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextStorage } from '../context/tenant-context.storage';
import { TenantContextData } from '../context/tenant-context.interface';

export const TenantContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContextData | undefined => {
    const request = ctx.switchToHttp().getRequest();
    if (request.tenantContext) {
      return request.tenantContext as TenantContextData;
    }
    return TenantContextStorage.get();
  }
);
