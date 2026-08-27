import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { PetSpecies } from '@prisma/client';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';

  const mockCustomer = {
    id: 'c1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    firstName: 'สมหญิง',
    lastName: 'รักสัตว์',
    phone: '0891112233',
    email: 'somying@example.com',
    pets: [
      {
        id: 'd1111111-1111-4111-a111-111111111111',
        name: 'โมจิ (Mochi)',
        species: PetSpecies.DOG,
        breed: 'Pomeranian',
      },
    ],
  };

  const mockPet = {
    id: 'd1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'โมจิ (Mochi)',
    species: PetSpecies.DOG,
    breed: 'Pomeranian',
    microchipNumber: '900182001928374',
    customer: {
      id: 'c1111111-1111-4111-a111-111111111111',
      firstName: 'สมหญิง',
      lastName: 'รักสัตว์',
      phone: '0891112233',
      lineUserId: 'U123456',
    },
  };

  const mockPrismaService = {
    customer: {
      findMany: jest.fn(),
    },
    pet: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty results if query is empty', async () => {
    const result = await service.search(mockTenantId, { q: '   ' });
    expect(result.customers).toEqual([]);
    expect(result.pets).toEqual([]);
    expect(result.totalResults).toBe(0);
  });

  it('should search customers and pets by name or phone keyword', async () => {
    mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
    mockPrismaService.pet.findMany.mockResolvedValue([mockPet]);

    const result = await service.search(mockTenantId, { q: '089-111-2233' });

    expect(result.query).toBe('089-111-2233');
    expect(result.customers.length).toBe(1);
    expect(result.pets.length).toBe(1);
    expect(result.totalResults).toBe(2);
    expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: mockTenantId,
        }),
      })
    );
  });
});
