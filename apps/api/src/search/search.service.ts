import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(tenantId: string, query: SearchQueryDto) {
    const rawTerm = query.q?.trim() || '';
    const limit = query.limit || 10;

    if (!rawTerm) {
      return {
        query: '',
        customers: [],
        pets: [],
        totalResults: 0,
      };
    }

    // Normalized phone search (remove spaces/hyphens)
    const digitsOnly = rawTerm.replace(/\D/g, '');

    const customerConditions: Prisma.CustomerWhereInput[] = [
      { firstName: { contains: rawTerm, mode: 'insensitive' } },
      { lastName: { contains: rawTerm, mode: 'insensitive' } },
      { phone: { contains: rawTerm } },
      { email: { contains: rawTerm, mode: 'insensitive' } },
      { pets: { some: { name: { contains: rawTerm, mode: 'insensitive' } } } },
    ];

    if (digitsOnly.length >= 3) {
      customerConditions.push({ phone: { contains: digitsOnly } });
    }

    const petConditions: Prisma.PetWhereInput[] = [
      { name: { contains: rawTerm, mode: 'insensitive' } },
      { breed: { contains: rawTerm, mode: 'insensitive' } },
      { microchipNumber: { contains: rawTerm } },
      {
        customer: {
          OR: [
            { firstName: { contains: rawTerm, mode: 'insensitive' } },
            { lastName: { contains: rawTerm, mode: 'insensitive' } },
            { phone: { contains: rawTerm } },
          ],
        },
      },
    ];

    if (digitsOnly.length >= 3) {
      petConditions.push({ microchipNumber: { contains: digitsOnly } });
    }

    const [customers, pets] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          tenantId,
          OR: customerConditions,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          pets: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
            },
          },
        },
      }),
      this.prisma.pet.findMany({
        where: {
          tenantId,
          isActive: true,
          OR: petConditions,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              lineUserId: true,
            },
          },
        },
      }),
    ]);

    return {
      query: rawTerm,
      customers,
      pets,
      totalResults: customers.length + pets.length,
    };
  }
}
