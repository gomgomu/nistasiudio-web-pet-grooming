import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { CreatePriceRuleDto } from './dto/create-price-rule.dto';
import { UpdatePriceRuleDto } from './dto/update-price-rule.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { PetSpecies, Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to serialize BigInt fields to numbers for JSON compatibility
  private serializeService<T extends { basePriceMinor?: bigint | number | null }>(
    service: T
  ) {
    if (!service) return service;
    return {
      ...service,
      basePriceMinor:
        service.basePriceMinor !== undefined && service.basePriceMinor !== null
          ? Number(service.basePriceMinor)
          : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Service Categories
  // ---------------------------------------------------------------------------

  async createCategory(tenantId: string, dto: CreateServiceCategoryDto) {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: dto.name.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Service category '${dto.name}' already exists in this organization`
      );
    }

    return this.prisma.serviceCategory.create({
      data: {
        tenantId,
        name: dto.name.trim(),
      },
    });
  }

  async findAllCategories(tenantId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
  }

  async findCategoryById(id: string, tenantId: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Service category with ID '${id}' not found`);
    }

    if (category.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Service category does not belong to your organization'
      );
    }

    return category;
  }

  async updateCategory(
    id: string,
    tenantId: string,
    dto: UpdateServiceCategoryDto
  ) {
    const category = await this.findCategoryById(id, tenantId);

    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.prisma.serviceCategory.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: dto.name.trim(),
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Service category '${dto.name}' already exists in this organization`
        );
      }
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
      },
    });
  }

  async deleteCategory(id: string, tenantId: string) {
    await this.findCategoryById(id, tenantId);

    // Unlink any services attached to this category before removing
    await this.prisma.service.updateMany({
      where: { categoryId: id, tenantId },
      data: { categoryId: null },
    });

    await this.prisma.serviceCategory.delete({
      where: { id },
    });

    return { message: 'Service category deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  async create(tenantId: string, dto: CreateServiceDto) {
    const existing = await this.prisma.service.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: dto.name.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Service with name '${dto.name}' already exists in this organization`
      );
    }

    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Service category with ID '${dto.categoryId}' not found`
        );
      }

      if (category.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Service category does not belong to your organization'
        );
      }
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
      });

      if (!branch) {
        throw new NotFoundException(`Branch with ID '${dto.branchId}' not found`);
      }

      if (branch.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Branch does not belong to your organization'
        );
      }
    }

    const service = await this.prisma.service.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        category: dto.category ?? 'GROOMING',
        durationMinutes: dto.durationMinutes ?? 60,
        basePriceMinor:
          dto.basePriceMinor !== undefined ? BigInt(dto.basePriceMinor) : BigInt(0),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        serviceCategory: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return this.serializeService(service);
  }

  async findAll(tenantId: string, query: QueryServiceDto) {
    const {
      q,
      category,
      categoryId,
      branchId,
      isActive,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      tenantId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (category) {
      where.category = category;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        include: {
          serviceCategory: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeService(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        serviceCategory: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    if (service.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Service does not belong to your organization'
      );
    }

    return this.serializeService(service);
  }

  async update(id: string, tenantId: string, dto: UpdateServiceDto) {
    const service = await this.findById(id, tenantId);

    if (dto.name && dto.name.trim() !== service.name) {
      const existing = await this.prisma.service.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: dto.name.trim(),
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Service with name '${dto.name}' already exists in this organization`
        );
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Service category with ID '${dto.categoryId}' not found`
        );
      }

      if (category.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Service category does not belong to your organization'
        );
      }
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
      });

      if (!branch) {
        throw new NotFoundException(`Branch with ID '${dto.branchId}' not found`);
      }

      if (branch.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Branch does not belong to your organization'
        );
      }
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        category: dto.category !== undefined ? dto.category : undefined,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
        durationMinutes:
          dto.durationMinutes !== undefined ? dto.durationMinutes : undefined,
        basePriceMinor:
          dto.basePriceMinor !== undefined
            ? BigInt(dto.basePriceMinor)
            : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      include: {
        serviceCategory: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return this.serializeService(updated);
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);

    await this.prisma.service.delete({
      where: { id },
    });

    return { message: 'Service deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // Price Rules
  // ---------------------------------------------------------------------------

  private serializePriceRule<
    T extends {
      priceMinor?: bigint | number | null;
      minWeight?: Prisma.Decimal | number | null;
      maxWeight?: Prisma.Decimal | number | null;
    }
  >(rule: T) {
    if (!rule) return rule;
    return {
      ...rule,
      priceMinor:
        rule.priceMinor !== undefined && rule.priceMinor !== null
          ? Number(rule.priceMinor)
          : 0,
      minWeight:
        rule.minWeight !== undefined && rule.minWeight !== null
          ? Number(rule.minWeight)
          : undefined,
      maxWeight:
        rule.maxWeight !== undefined && rule.maxWeight !== null
          ? Number(rule.maxWeight)
          : undefined,
    };
  }

  async createPriceRule(tenantId: string, dto: CreatePriceRuleDto) {
    // 1. Verify service belongs to tenant
    await this.findById(dto.serviceId, tenantId);

    if (
      dto.minWeight !== undefined &&
      dto.maxWeight !== undefined &&
      dto.minWeight > dto.maxWeight
    ) {
      throw new BadRequestException('minWeight cannot be greater than maxWeight');
    }

    const rule = await this.prisma.servicePriceRule.create({
      data: {
        tenantId,
        serviceId: dto.serviceId,
        species: dto.species ?? PetSpecies.DOG,
        name: dto.name?.trim(),
        minWeight:
          dto.minWeight !== undefined
            ? new Prisma.Decimal(dto.minWeight)
            : undefined,
        maxWeight:
          dto.maxWeight !== undefined
            ? new Prisma.Decimal(dto.maxWeight)
            : undefined,
        priceMinor: BigInt(dto.priceMinor),
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.serializePriceRule(rule);
  }

  async findPriceRulesByService(serviceId: string, tenantId: string) {
    await this.findById(serviceId, tenantId);

    const rules = await this.prisma.servicePriceRule.findMany({
      where: { serviceId, tenantId },
      orderBy: [{ species: 'asc' }, { minWeight: 'asc' }],
    });

    return rules.map((r) => this.serializePriceRule(r));
  }

  async findPriceRuleById(id: string, tenantId: string) {
    const rule = await this.prisma.servicePriceRule.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!rule) {
      throw new NotFoundException(`Service price rule with ID '${id}' not found`);
    }

    if (rule.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Price rule does not belong to your organization'
      );
    }

    return this.serializePriceRule(rule);
  }

  async updatePriceRule(
    id: string,
    tenantId: string,
    dto: UpdatePriceRuleDto
  ) {
    const existing = await this.findPriceRuleById(id, tenantId);

    const minWeight =
      dto.minWeight !== undefined ? dto.minWeight : existing.minWeight;
    const maxWeight =
      dto.maxWeight !== undefined ? dto.maxWeight : existing.maxWeight;

    if (
      minWeight !== undefined &&
      maxWeight !== undefined &&
      minWeight > maxWeight
    ) {
      throw new BadRequestException('minWeight cannot be greater than maxWeight');
    }

    const updated = await this.prisma.servicePriceRule.update({
      where: { id },
      data: {
        species: dto.species !== undefined ? dto.species : undefined,
        name: dto.name !== undefined ? dto.name?.trim() : undefined,
        minWeight:
          dto.minWeight !== undefined
            ? new Prisma.Decimal(dto.minWeight)
            : undefined,
        maxWeight:
          dto.maxWeight !== undefined
            ? new Prisma.Decimal(dto.maxWeight)
            : undefined,
        priceMinor:
          dto.priceMinor !== undefined ? BigInt(dto.priceMinor) : undefined,
        durationMinutes:
          dto.durationMinutes !== undefined ? dto.durationMinutes : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });

    return this.serializePriceRule(updated);
  }

  async deletePriceRule(id: string, tenantId: string) {
    await this.findPriceRuleById(id, tenantId);

    await this.prisma.servicePriceRule.delete({
      where: { id },
    });

    return { message: 'Service price rule deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // Pricing Calculation Engine
  // ---------------------------------------------------------------------------

  async calculateServicePrice(tenantId: string, dto: CalculatePriceDto) {
    const service = await this.findById(dto.serviceId, tenantId);

    let species = dto.species ?? PetSpecies.DOG;
    let weightKg = dto.weightKg;

    if (dto.petId) {
      const pet = await this.prisma.pet.findUnique({
        where: { id: dto.petId },
      });

      if (!pet) {
        throw new NotFoundException(`Pet with ID '${dto.petId}' not found`);
      }

      if (pet.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Pet does not belong to your organization'
        );
      }

      species = pet.species;
      if (weightKg === undefined && pet.weight !== null) {
        weightKg = Number(pet.weight);
      }
    }

    // Fetch active rules for this service and species
    const rules = await this.prisma.servicePriceRule.findMany({
      where: {
        tenantId,
        serviceId: service.id,
        species,
        isActive: true,
      },
      orderBy: [{ minWeight: 'asc' }],
    });

    // Find rule matching weightKg
    let matchedRule = null;
    if (weightKg !== undefined) {
      matchedRule = rules.find((r) => {
        const min = r.minWeight !== null ? Number(r.minWeight) : 0;
        const max = r.maxWeight !== null ? Number(r.maxWeight) : Infinity;
        return weightKg! >= min && weightKg! <= max;
      });
    }

    if (matchedRule) {
      return {
        serviceId: service.id,
        serviceName: service.name,
        appliedRuleId: matchedRule.id,
        appliedRuleName: matchedRule.name || undefined,
        isRuleApplied: true,
        species,
        weightKg,
        finalPriceMinor: Number(matchedRule.priceMinor),
        durationMinutes: matchedRule.durationMinutes ?? service.durationMinutes,
      };
    }

    // Fallback to default base service price
    return {
      serviceId: service.id,
      serviceName: service.name,
      appliedRuleId: undefined,
      appliedRuleName: undefined,
      isRuleApplied: false,
      species,
      weightKg,
      finalPriceMinor: service.basePriceMinor,
      durationMinutes: service.durationMinutes,
    };
  }
}
