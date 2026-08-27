import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${dto.tenantId}' does not exist`);
    }

    // Verify branch code is unique within tenant
    const existing = await this.prisma.branch.findUnique({
      where: {
        tenantId_code: {
          tenantId: dto.tenantId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Branch code '${dto.code}' already exists in this tenant`);
    }

    return this.prisma.branch.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        code: dto.code,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.branch.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, tenantId?: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID '${id}' not found`);
    }

    // Strict Tenant Isolation check
    if (tenantId && branch.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: branch belongs to another tenant');
    }

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto, tenantId?: string) {
    const branch = await this.findById(id, tenantId);

    if (dto.code && dto.code !== branch.code) {
      const existing = await this.prisma.branch.findUnique({
        where: {
          tenantId_code: {
            tenantId: branch.tenantId,
            code: dto.code,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Branch code '${dto.code}' is already used by another branch in this tenant`);
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }
}
