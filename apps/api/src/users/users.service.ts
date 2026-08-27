import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT_SAFE = {
  id: true,
  tenantId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  userBranches: {
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async create(dto: CreateUserDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${dto.tenantId}' not found`);
    }

    // 2. Check if email already used in this tenant
    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: dto.tenantId,
          email: dto.email.toLowerCase().trim(),
        },
      },
    });
    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists in this tenant`);
    }

    // 3. Hash password
    const passwordHash = await this.hashPassword(dto.password);

    // 4. Create user with branch mappings in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: dto.tenantId,
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role || 'STAFF',
          status: dto.status || 'ACTIVE',
          phone: dto.phone,
        },
      });

      if (dto.branchIds && dto.branchIds.length > 0) {
        await tx.userBranch.createMany({
          data: dto.branchIds.map((branchId) => ({
            userId: user.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: USER_SELECT_SAFE,
      });
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: USER_SELECT_SAFE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT_SAFE,
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: User belongs to another tenant');
    }

    return user;
  }

  async findByEmailForAuth(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase().trim(),
        },
      },
      include: {
        userBranches: {
          include: {
            branch: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto, tenantId?: string) {
    const existing = await this.findById(id, tenantId);

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await this.hashPassword(dto.password);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.branchIds) {
        // Remove existing branch relations and replace
        await tx.userBranch.deleteMany({
          where: { userId: id },
        });

        if (dto.branchIds.length > 0) {
          await tx.userBranch.createMany({
            data: dto.branchIds.map((branchId) => ({
              userId: id,
              branchId,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.user.update({
        where: { id },
        data: {
          email: dto.email ? dto.email.toLowerCase().trim() : existing.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          status: dto.status,
          phone: dto.phone,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      return tx.user.findUnique({
        where: { id },
        select: USER_SELECT_SAFE,
      });
    });
  }

  async assignBranches(userId: string, branchIds: string[], tenantId?: string) {
    await this.findById(userId, tenantId);

    return this.prisma.$transaction(async (tx) => {
      await tx.userBranch.deleteMany({
        where: { userId },
      });

      if (branchIds.length > 0) {
        await tx.userBranch.createMany({
          data: branchIds.map((branchId) => ({
            userId,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: USER_SELECT_SAFE,
      });
    });
  }
}
