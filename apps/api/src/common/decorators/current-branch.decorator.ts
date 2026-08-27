import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextStorage } from '../context/tenant-context.storage';

export const CurrentBranch = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.activeBranchId || TenantContextStorage.getActiveBranchId();
  }
);
