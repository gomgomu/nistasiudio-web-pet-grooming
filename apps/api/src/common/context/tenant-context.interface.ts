import { UserRole } from '@prisma/client';

export interface TenantContextData {
  tenantId: string;
  userId: string;
  userRole: UserRole;
  activeBranchId?: string;
  allowedBranchIds: string[];
  isSuperAdmin: boolean;
}
