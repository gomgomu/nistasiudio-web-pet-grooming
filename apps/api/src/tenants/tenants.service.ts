import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Tenant with slug '${dto.slug}' already exists`);
    }

    // Create tenant with a default primary branch in a transaction
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          businessType: dto.businessType,
          phone: dto.phone,
          email: dto.email,
          timezone: dto.timezone || 'Asia/Bangkok',
        },
      });

      // Default Main Branch
      await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'สำนักงานใหญ่ (Main Branch)',
          code: 'MAIN',
          phone: dto.phone,
        },
      });

      return tenant;
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        branches: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        branches: {
          where: { isActive: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Tenant slug '${dto.slug}' is already in use`);
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }
}
