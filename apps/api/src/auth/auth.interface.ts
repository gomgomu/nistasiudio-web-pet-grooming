import { UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
  branchIds: string[];
}

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  tenantId: string;
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  allowedBranches: {
    id: string;
    name: string;
    code: string;
  }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
