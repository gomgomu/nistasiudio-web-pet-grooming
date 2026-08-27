import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BusinessType, UserRole, UserStatus } from '@prisma/client';

describe('App & Domain Controllers (e2e)', () => {
  let app: INestApplication;

  const mockTenant = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Happy Paws Clinic',
    slug: 'happy-paws',
    businessType: BusinessType.HYBRID_CLINIC_GROOMING,
    phone: '02-123-4567',
    email: 'contact@happypaws.com',
    timezone: 'Asia/Bangkok',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockBranch = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    tenantId: mockTenant.id,
    name: 'สำนักงานใหญ่ (Main Branch)',
    code: 'MAIN',
    address: '123 Sukhumvit',
    phone: '02-123-4567',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPasswordHash = bcrypt.hashSync('Password123!', 8);

  const mockUser = {
    id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    tenantId: mockTenant.id,
    email: 'staff@happypaws.com',
    passwordHash: mockPasswordHash,
    firstName: 'สมหญิง',
    lastName: 'ใจดี',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    phone: '081-234-5678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userBranches: [{ branch: { id: mockBranch.id, name: mockBranch.name, code: mockBranch.code } }],
  };

  const mockPrismaService: Record<string, any> = {
    isHealthy: jest.fn().mockResolvedValue(true),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    tenant: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === mockTenant.id || where.slug === mockTenant.slug) {
          return Promise.resolve(mockTenant);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([mockTenant]),
      create: jest.fn().mockResolvedValue(mockTenant),
      update: jest.fn().mockResolvedValue(mockTenant),
    },
    branch: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === mockBranch.id) {
          return Promise.resolve(mockBranch);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([mockBranch]),
      create: jest.fn().mockResolvedValue(mockBranch),
      update: jest.fn().mockResolvedValue(mockBranch),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where, select }) => {
        if (where.tenantId_email && where.tenantId_email.email === mockUser.email) {
          return Promise.resolve(mockUser);
        }
        if (where.id === mockUser.id) {
          if (select && !select.passwordHash) {
            const { passwordHash: _, ...safe } = mockUser;
            return Promise.resolve(safe);
          }
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(() => {
        const { passwordHash: _, ...safe } = mockUser;
        return Promise.resolve([safe]);
      }),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
    userBranch: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrismaService)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health API', () => {
    it('/api/v1/health (GET) returns standardized response format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('ok');
          expect(res.body.data.service).toBe('PetFlow API');
          expect(res.body.data.database).toBe('connected');
          expect(res.body.data.uptimeSeconds).toBeDefined();
        });
    });

    it('non-existing route returns standardized exception filter response', () => {
      return request(app.getHttpServer())
        .get('/api/v1/not-found-route')
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
          expect(res.body.path).toBe('/api/v1/not-found-route');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('Tenants API', () => {
    it('/api/v1/tenants (GET) returns list of tenants', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tenants')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data[0].slug).toBe('happy-paws');
        });
    });

    it('/api/v1/tenants/:id (GET) returns tenant details by UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tenants/${mockTenant.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(mockTenant.id);
        });
    });
  });

  describe('Branches API & Tenant Isolation', () => {
    it('/api/v1/branches (GET) returns tenant branches', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/branches?tenantId=${mockTenant.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data[0].code).toBe('MAIN');
        });
    });

    it('/api/v1/branches/:id (GET) with mismatched tenantId enforces isolation (403 Forbidden)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/branches/${mockBranch.id}?tenantId=c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33`)
        .expect(403)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('Forbidden');
        });
    });
  });

  describe('Users API & Tenant Isolation', () => {
    it('/api/v1/users (GET) returns tenant users with safe fields', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users?tenantId=${mockTenant.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data[0].email).toBe('staff@happypaws.com');
          expect(res.body.data[0].passwordHash).toBeUndefined();
        });
    });

    it('/api/v1/users/:id (GET) with mismatched tenantId enforces isolation (403 Forbidden)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${mockUser.id}?tenantId=c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33`)
        .expect(403)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('Forbidden');
        });
    });
  });

  describe('Auth API', () => {
    it('/api/v1/auth/login (POST) successfully authenticates and returns JWT tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.tokens.accessToken).toBeDefined();
          expect(res.body.data.tokens.refreshToken).toBeDefined();
          expect(res.body.data.user.email).toBe('staff@happypaws.com');
          expect(res.body.data.user.role).toBe(UserRole.STAFF);
        });
    });

    it('/api/v1/auth/login (POST) rejects wrong password with 401 Unauthorized', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'IncorrectPassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('Unauthorized');
        });
    });

    it('/api/v1/auth/me (GET) with valid token returns user profile', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'Password123!',
        });

      const token = loginRes.body.data.tokens.accessToken;

      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.id).toBe(mockUser.id);
      expect(meRes.body.data.tenantId).toBe(mockTenant.id);
    });

    it('/api/v1/auth/me (GET) with unauthorized x-branch-id rejects with 403 Forbidden', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'Password123!',
        });

      const token = loginRes.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .set('x-branch-id', 'unauthorized-branch-uuid')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });
  });

  describe('RBAC Guard & Permissions Enforcement', () => {
    it('STAFF / RECEPTIONIST cannot perform owner-only operations (PATCH /api/v1/tenants/:id -> 403 Forbidden)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'Password123!',
        });

      const staffToken = loginRes.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${mockTenant.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Hacked Clinic Name' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('STAFF / RECEPTIONIST cannot create new users (POST /api/v1/users -> 403 Forbidden)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tenantSlug: 'happy-paws',
          email: 'staff@happypaws.com',
          password: 'Password123!',
        });

      const staffToken = loginRes.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          tenantId: mockTenant.id,
          email: 'newstaff@happypaws.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'Staff',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });
  });
});
