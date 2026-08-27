import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { Prisma, StaffType, UserRole, UserStatus } from '@prisma/client';

export const STAFF_SELECT_SAFE = {
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
  staffProfile: true,
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
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // ---------------------------------------------------------------------------
  // Create Staff
  // ---------------------------------------------------------------------------

  async create(tenantId: string, dto: CreateStaffDto) {
    if (dto.userId) {
      // 1. Attach profile to existing user
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        include: { staffProfile: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID '${dto.userId}' not found`);
      }

      if (user.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: User does not belong to your organization'
        );
      }

      if (user.staffProfile) {
        throw new ConflictException(
          'Staff profile already exists for this user'
        );
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.staffProfile.create({
          data: {
            tenantId,
            userId: user.id,
            nickname: dto.nickname?.trim(),
            staffType: dto.staffType ?? StaffType.GENERAL_STAFF,
            specialties: dto.specialties ?? [],
            licenseNumber: dto.licenseNumber?.trim(),
            bio: dto.bio?.trim(),
            colorCode: dto.colorCode?.trim(),
            avatarUrl: dto.avatarUrl?.trim(),
            isBookable: dto.isBookable !== undefined ? dto.isBookable : true,
          },
        });

        if (dto.branchIds && dto.branchIds.length > 0) {
          // Verify branches belong to tenant
          const branches = await tx.branch.findMany({
            where: { id: { in: dto.branchIds }, tenantId },
          });
          if (branches.length !== dto.branchIds.length) {
            throw new BadRequestException('One or more invalid branch IDs');
          }

          await tx.userBranch.deleteMany({ where: { userId: user.id } });
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
          select: STAFF_SELECT_SAFE,
        });
      });
    }

    // 2. Create brand new User + StaffProfile
    if (!dto.email || !dto.password || !dto.firstName || !dto.lastName) {
      throw new BadRequestException(
        'email, password, firstName, and lastName are required when creating a new staff member'
      );
    }

    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `User with email '${dto.email}' already exists in this organization`
      );
    }

    if (dto.branchIds && dto.branchIds.length > 0) {
      const branches = await this.prisma.branch.findMany({
        where: { id: { in: dto.branchIds }, tenantId },
      });
      if (branches.length !== dto.branchIds.length) {
        throw new BadRequestException('One or more invalid branch IDs');
      }
    }

    const passwordHash = await this.hashPassword(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email,
          passwordHash,
          firstName: dto.firstName!.trim(),
          lastName: dto.lastName!.trim(),
          phone: dto.phone?.trim(),
          role: dto.role ?? UserRole.GROOMER,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.staffProfile.create({
        data: {
          tenantId,
          userId: user.id,
          nickname: dto.nickname?.trim(),
          staffType: dto.staffType ?? StaffType.GROOMER,
          specialties: dto.specialties ?? [],
          licenseNumber: dto.licenseNumber?.trim(),
          bio: dto.bio?.trim(),
          colorCode: dto.colorCode?.trim(),
          avatarUrl: dto.avatarUrl?.trim(),
          isBookable: dto.isBookable !== undefined ? dto.isBookable : true,
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
        select: STAFF_SELECT_SAFE,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Find All Staff
  // ---------------------------------------------------------------------------

  async findAll(tenantId: string, query: QueryStaffDto) {
    const {
      q,
      staffType,
      role,
      branchId,
      isBookable,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      tenantId,
      staffProfile: {
        isNot: null,
      },
    };

    if (role) {
      where.role = role;
    }

    if (staffType || isBookable !== undefined) {
      where.staffProfile = {
        is: {
          ...(staffType ? { staffType } : {}),
          ...(isBookable !== undefined ? { isBookable } : {}),
        },
      };
    }

    if (branchId) {
      where.userBranches = {
        some: { branchId },
      };
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { staffProfile: { nickname: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        select: STAFF_SELECT_SAFE,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ---------------------------------------------------------------------------
  // Find Staff By ID (User ID or StaffProfile ID)
  // ---------------------------------------------------------------------------

  async findById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id }, { staffProfile: { id } }],
      },
      select: STAFF_SELECT_SAFE,
    });

    if (!user) {
      throw new NotFoundException(`Staff member with ID '${id}' not found`);
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Staff does not belong to your organization'
      );
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Update Staff
  // ---------------------------------------------------------------------------

  async update(id: string, tenantId: string, dto: UpdateStaffDto) {
    const existing = await this.findById(id, tenantId);

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await this.hashPassword(dto.password);
    }

    if (dto.branchIds && dto.branchIds.length > 0) {
      const branches = await this.prisma.branch.findMany({
        where: { id: { in: dto.branchIds }, tenantId },
      });
      if (branches.length !== dto.branchIds.length) {
        throw new BadRequestException('One or more invalid branch IDs');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update User entity
      await tx.user.update({
        where: { id: existing.id },
        data: {
          firstName: dto.firstName !== undefined ? dto.firstName.trim() : undefined,
          lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,
          phone: dto.phone !== undefined ? dto.phone.trim() : undefined,
          role: dto.role !== undefined ? dto.role : undefined,
          status: dto.status !== undefined ? dto.status : undefined,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      // 2. Update or Upsert StaffProfile
      await tx.staffProfile.upsert({
        where: { userId: existing.id },
        create: {
          tenantId,
          userId: existing.id,
          nickname: dto.nickname?.trim(),
          staffType: dto.staffType ?? StaffType.GENERAL_STAFF,
          specialties: dto.specialties ?? [],
          licenseNumber: dto.licenseNumber?.trim(),
          bio: dto.bio?.trim(),
          colorCode: dto.colorCode?.trim(),
          avatarUrl: dto.avatarUrl?.trim(),
          isBookable: dto.isBookable !== undefined ? dto.isBookable : true,
        },
        update: {
          nickname: dto.nickname !== undefined ? dto.nickname?.trim() : undefined,
          staffType: dto.staffType !== undefined ? dto.staffType : undefined,
          specialties: dto.specialties !== undefined ? dto.specialties : undefined,
          licenseNumber:
            dto.licenseNumber !== undefined ? dto.licenseNumber?.trim() : undefined,
          bio: dto.bio !== undefined ? dto.bio?.trim() : undefined,
          colorCode:
            dto.colorCode !== undefined ? dto.colorCode?.trim() : undefined,
          avatarUrl:
            dto.avatarUrl !== undefined ? dto.avatarUrl?.trim() : undefined,
          isBookable:
            dto.isBookable !== undefined ? dto.isBookable : undefined,
        },
      });

      // 3. Update Branches if specified
      if (dto.branchIds !== undefined) {
        await tx.userBranch.deleteMany({ where: { userId: existing.id } });
        if (dto.branchIds.length > 0) {
          await tx.userBranch.createMany({
            data: dto.branchIds.map((branchId) => ({
              userId: existing.id,
              branchId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.user.findUnique({
        where: { id: existing.id },
        select: STAFF_SELECT_SAFE,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Delete / Deactivate Staff
  // ---------------------------------------------------------------------------

  async delete(id: string, tenantId: string) {
    const existing = await this.findById(id, tenantId);

    // Deactivate user and mark unbookable
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: existing.id },
        data: { status: UserStatus.INACTIVE },
      }),
      this.prisma.staffProfile.updateMany({
        where: { userId: existing.id },
        data: { isBookable: false },
      }),
    ]);

    return { message: 'Staff member deactivated successfully' };
  }
}
