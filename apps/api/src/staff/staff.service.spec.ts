import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StaffType, UserRole, UserStatus } from '@prisma/client';

describe('StaffService', () => {
  let service: StaffService;
  let prisma: PrismaService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockOtherTenantId = 't2222222-2222-4222-a222-222222222222';

  const mockBranch = {
    id: 'b1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    name: 'สาขาหลัก',
    code: 'HQ01',
  };

  const mockStaffProfile = {
    id: 'sp-1111-1111-1111-111111111111',
    tenantId: mockTenantId,
    userId: 'u1111111-1111-4111-a111-111111111111',
    nickname: 'ช่างกานต์',
    staffType: StaffType.GROOMER,
    specialties: ['กรูมมิ่งสุนัขพันธุ์เล็ก', 'สปาโอโซน'],
    licenseNumber: null,
    bio: 'ช่างกรูมมิ่งมืออาชีพ ประสบการณ์ 6 ปี',
    colorCode: '#4F46E5',
    avatarUrl: 'https://example.com/avatar.jpg',
    isBookable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'u1111111-1111-4111-a111-111111111111',
    tenantId: mockTenantId,
    email: 'karn@petflow.test',
    passwordHash: 'hashed_password',
    firstName: 'กานต์',
    lastName: 'สว่างจิตต์',
    phone: '089-999-8888',
    role: UserRole.GROOMER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    staffProfile: mockStaffProfile,
    userBranches: [
      {
        userId: 'u1111111-1111-4111-a111-111111111111',
        branchId: mockBranch.id,
        branch: mockBranch,
      },
    ],
  };

  const mockPrismaService: any = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    staffProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    branch: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userBranch: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callbackOrArray: any): Promise<any> => {
      if (typeof callbackOrArray === 'function') {
        return callbackOrArray(mockPrismaService);
      }
      return Promise.all(callbackOrArray);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Create Staff
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create a new staff user + profile + branches successfully', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // uniqueness check
        .mockResolvedValueOnce(mockUser); // result from tx
      mockPrismaService.branch.findMany.mockResolvedValue([mockBranch]);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.staffProfile.create.mockResolvedValue(mockStaffProfile);

      const result = await service.create(mockTenantId, {
        email: 'karn@petflow.test',
        password: 'Password123!',
        firstName: 'กานต์',
        lastName: 'สว่างจิตต์',
        nickname: 'ช่างกานต์',
        staffType: StaffType.GROOMER,
        role: UserRole.GROOMER,
        branchIds: [mockBranch.id],
      });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.staffProfile.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if required user fields are missing for new staff', async () => {
      await expect(
        service.create(mockTenantId, {
          firstName: 'กานต์',
          // missing email and password
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if staff email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create(mockTenantId, {
          email: 'karn@petflow.test',
          password: 'Password123!',
          firstName: 'กานต์',
          lastName: 'สว่างจิตต์',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if invalid branchIds are passed', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.branch.findMany.mockResolvedValue([]); // Branch not found

      await expect(
        service.create(mockTenantId, {
          email: 'karn@petflow.test',
          password: 'Password123!',
          firstName: 'กานต์',
          lastName: 'สว่างจิตต์',
          branchIds: ['invalid-branch-id'],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should attach staff profile to existing user successfully', async () => {
      const userWithoutProfile = { ...mockUser, staffProfile: null };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(userWithoutProfile) // find existing user
        .mockResolvedValueOnce(mockUser); // result from tx
      mockPrismaService.staffProfile.create.mockResolvedValue(mockStaffProfile);

      const result = await service.create(mockTenantId, {
        userId: userWithoutProfile.id,
        nickname: 'ช่างกานต์',
        staffType: StaffType.GROOMER,
      });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.staffProfile.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if existing user belongs to another tenant', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.create(mockTenantId, {
          userId: mockUser.id,
          nickname: 'ช่างกานต์',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if existing user already has a staff profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser); // already has staffProfile

      await expect(
        service.create(mockTenantId, {
          userId: mockUser.id,
          nickname: 'ช่างกานต์',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // Find All Staff
  // ---------------------------------------------------------------------------

  describe('findAll', () => {
    it('should return paginated staff list with filter', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, {
        q: 'กานต์',
        staffType: StaffType.GROOMER,
        role: UserRole.GROOMER,
        branchId: mockBranch.id,
        isBookable: true,
        page: 1,
        limit: 20,
      });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].email).toEqual('karn@petflow.test');
    });
  });

  // ---------------------------------------------------------------------------
  // Find Staff By ID
  // ---------------------------------------------------------------------------

  describe('findById', () => {
    it('should return staff member by ID', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id, mockTenantId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if staff not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findById('non-existent-id', mockTenantId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if staff belongs to another tenant', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        tenantId: mockOtherTenantId,
      });

      await expect(
        service.findById(mockUser.id, mockTenantId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // Update Staff
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('should update user and profile details successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.staffProfile.upsert.mockResolvedValue(mockStaffProfile);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        firstName: 'กานต์พัชร',
      });

      const result = await service.update(mockUser.id, mockTenantId, {
        firstName: 'กานต์พัชร',
        nickname: 'พี่กานต์',
        staffType: StaffType.GROOMER,
      });

      expect(result?.firstName).toEqual('กานต์พัชร');
    });
  });

  // ---------------------------------------------------------------------------
  // Delete / Deactivate Staff
  // ---------------------------------------------------------------------------

  describe('delete', () => {
    it('should deactivate staff user and mark unbookable', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: UserStatus.INACTIVE,
      });
      mockPrismaService.staffProfile.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.delete(mockUser.id, mockTenantId);
      expect(result).toEqual({ message: 'Staff member deactivated successfully' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { status: UserStatus.INACTIVE },
      });
      expect(mockPrismaService.staffProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { isBookable: false },
      });
    });
  });
});
