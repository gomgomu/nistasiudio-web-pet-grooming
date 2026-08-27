import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const mockTenant = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Happy Paws Clinic',
    slug: 'happy-paws',
  };

  const mockUser = {
    id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    tenantId: mockTenant.id,
    email: 'staff@happypaws.com',
    passwordHash: '$2a$10$encryptedhash',
    firstName: 'Somying',
    lastName: 'Jaidee',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    userBranches: [
      {
        branch: {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
          name: 'Main',
          code: 'MAIN',
        },
      },
    ],
  };

  const mockTenantsService = {
    findBySlug: jest.fn(),
  };

  const mockUsersService = {
    findByEmailForAuth: jest.fn(),
    findById: jest.fn(),
    verifyPassword: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key-that-is-at-least-32-characters'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      mockTenantsService.findBySlug.mockResolvedValue(mockTenant);
      mockUsersService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockUsersService.verifyPassword.mockResolvedValue(true);

      const result = await service.login({
        tenantSlug: 'happy-paws',
        email: 'staff@happypaws.com',
        password: 'Password123!',
      });

      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('staff@happypaws.com');
      expect(result.user.allowedBranches.length).toBe(1);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockTenantsService.findBySlug.mockResolvedValue(mockTenant);
      mockUsersService.findByEmailForAuth.mockResolvedValue(mockUser);
      mockUsersService.verifyPassword.mockResolvedValue(false);

      await expect(
        service.login({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      mockTenantsService.findBySlug.mockResolvedValue(mockTenant);
      mockUsersService.findByEmailForAuth.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.login({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
