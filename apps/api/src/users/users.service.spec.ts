import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'staff@happypaws.com',
    firstName: 'Somying',
    lastName: 'Jaidee',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: '081-234-5678',
    createdAt: new Date(),
    updatedAt: new Date(),
    userBranches: [],
  };

  const mockPrismaService: Record<string, any> = {
    tenant: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userBranch: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('password hashing', () => {
    it('should hash password and verify successfully', async () => {
      const plain = 'SuperSecret123!';
      const hash = await service.hashPassword(plain);

      expect(hash).not.toBe(plain);
      const isMatch = await service.verifyPassword(plain, hash);
      expect(isMatch).toBe(true);

      const isWrong = await service.verifyPassword('WrongPassword', hash);
      expect(isWrong).toBe(false);
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: mockUser.tenantId });
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // for existing email check
        .mockResolvedValueOnce(mockUser); // for final select
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        tenantId: mockUser.tenantId,
        email: 'staff@happypaws.com',
        password: 'Password123!',
        firstName: 'Somying',
        lastName: 'Jaidee',
      });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists in tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: mockUser.tenantId });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({
          tenantId: mockUser.tenantId,
          email: 'staff@happypaws.com',
          password: 'Password123!',
          firstName: 'Somying',
          lastName: 'Jaidee',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('tenant isolation', () => {
    it('should throw ForbiddenException if user belongs to another tenant', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.findById(mockUser.id, 'different-tenant-uuid')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return user if tenant matches', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id, mockUser.tenantId);
      expect(result).toEqual(mockUser);
    });
  });
});
