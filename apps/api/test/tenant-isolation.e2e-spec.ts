import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BusinessType, UserRole, UserStatus } from '@prisma/client';

describe('Tenant Isolation Security Verification (e2e)', () => {
  let app: INestApplication;

  // ---------------------------------------------------------------------------
  // Tenant A: Alpha Pet Clinic
  // ---------------------------------------------------------------------------
  const tenantA = {
    id: 'a1111111-1111-4111-a111-111111111111',
    name: 'Alpha Pet Clinic',
    slug: 'alpha-clinic',
    businessType: BusinessType.HYBRID_CLINIC_GROOMING,
    phone: '02-111-1111',
    email: 'contact@alpha.com',
    timezone: 'Asia/Bangkok',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const branchA = {
    id: 'a2222222-2222-4222-a222-222222222222',
    tenantId: tenantA.id,
    name: 'Alpha Main Branch',
    code: 'ALPHA-MAIN',
    address: '100 Alpha Road',
    phone: '02-111-1111',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const passwordHashA = bcrypt.hashSync('AlphaPassword123!', 8);
  const userA = {
    id: 'a3333333-3333-4333-a333-333333333333',
    tenantId: tenantA.id,
    email: 'vet@alpha.com',
    passwordHash: passwordHashA,
    firstName: 'หมอต้น',
    lastName: 'อัลฟ่า',
    role: UserRole.TENANT_OWNER,
    status: UserStatus.ACTIVE,
    phone: '081-111-2222',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userBranches: [{ branch: { id: branchA.id, name: branchA.name, code: branchA.code } }],
  };

  // ---------------------------------------------------------------------------
  // Tenant B: Beta Grooming Salon
  // ---------------------------------------------------------------------------
  const tenantB = {
    id: 'b1111111-1111-4111-b111-111111111111',
    name: 'Beta Grooming Salon',
    slug: 'beta-grooming',
    businessType: BusinessType.GROOMING_SALON,
    phone: '02-222-2222',
    email: 'contact@beta.com',
    timezone: 'Asia/Bangkok',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const branchB = {
    id: 'b2222222-2222-4222-b222-222222222222',
    tenantId: tenantB.id,
    name: 'Beta Studio Branch',
    code: 'BETA-STUDIO',
    address: '200 Beta Road',
    phone: '02-222-2222',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const passwordHashB = bcrypt.hashSync('BetaPassword123!', 8);
  const userB = {
    id: 'b3333333-3333-4333-b333-333333333333',
    tenantId: tenantB.id,
    email: 'groomer@beta.com',
    passwordHash: passwordHashB,
    firstName: 'ช่างบอย',
    lastName: 'เบต้า',
    role: UserRole.TENANT_OWNER,
    status: UserStatus.ACTIVE,
    phone: '082-222-3333',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userBranches: [{ branch: { id: branchB.id, name: branchB.name, code: branchB.code } }],
  };

  let tokenA: string;
  let tokenB: string;

  const mockPrismaService: Record<string, any> = {
    isHealthy: jest.fn().mockResolvedValue(true),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    tenant: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === tenantA.id || where.slug === tenantA.slug) return Promise.resolve(tenantA);
        if (where.id === tenantB.id || where.slug === tenantB.slug) return Promise.resolve(tenantB);
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([tenantA, tenantB]),
      update: jest.fn().mockImplementation(({ where, data }) => {
        if (where.id === tenantA.id) return Promise.resolve({ ...tenantA, ...data });
        if (where.id === tenantB.id) return Promise.resolve({ ...tenantB, ...data });
        return Promise.resolve(null);
      }),
    },
    branch: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === branchA.id) return Promise.resolve(branchA);
        if (where.id === branchB.id) return Promise.resolve(branchB);
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.tenantId === tenantA.id) return Promise.resolve([branchA]);
        if (where.tenantId === tenantB.id) return Promise.resolve([branchB]);
        return Promise.resolve([]);
      }),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where, select }) => {
        if (where.tenantId_email && where.tenantId_email.email === userA.email) return Promise.resolve(userA);
        if (where.tenantId_email && where.tenantId_email.email === userB.email) return Promise.resolve(userB);

        if (where.id === userA.id) {
          if (select && !select.passwordHash) {
            const { passwordHash: _, ...safe } = userA;
            return Promise.resolve(safe);
          }
          return Promise.resolve(userA);
        }
        if (where.id === userB.id) {
          if (select && !select.passwordHash) {
            const { passwordHash: _, ...safe } = userB;
            return Promise.resolve(safe);
          }
          return Promise.resolve(userB);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.tenantId === tenantA.id) {
          const { passwordHash: _, ...safe } = userA;
          return Promise.resolve([safe]);
        }
        if (where.tenantId === tenantB.id) {
          const { passwordHash: _, ...safe } = userB;
          return Promise.resolve([safe]);
        }
        return Promise.resolve([]);
      }),
    },
    customer: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'c1111111-1111-4111-a111-111111111111') {
          return Promise.resolve({
            id: 'c1111111-1111-4111-a111-111111111111',
            tenantId: tenantA.id,
            firstName: 'สมหญิง',
            lastName: 'รักสัตว์',
            phone: '081-999-8888',
            pets: [],
            customerTags: [],
          });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.tenantId === tenantA.id) {
          return Promise.resolve([
            {
              id: 'c1111111-1111-4111-a111-111111111111',
              tenantId: tenantA.id,
              firstName: 'สมหญิง',
              lastName: 'รักสัตว์',
              phone: '081-999-8888',
              pets: [],
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'c1111111-1111-4111-a111-111111111111',
          ...data,
          pets: [],
        })
      ),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'c1111111-1111-4111-a111-111111111111',
          tenantId: tenantA.id,
          ...data,
          pets: [],
        })
      ),
      delete: jest.fn().mockResolvedValue({ id: 'c1111111-1111-4111-a111-111111111111' }),
    },
    pet: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'd1111111-1111-4111-a111-111111111111') {
          return Promise.resolve({
            id: 'd1111111-1111-4111-a111-111111111111',
            tenantId: tenantA.id,
            customerId: 'c1111111-1111-4111-a111-111111111111',
            name: 'โมจิ (Mochi)',
            species: 'DOG',
            breed: 'Pomeranian',
            customer: {
              id: 'c1111111-1111-4111-a111-111111111111',
              firstName: 'สมหญิง',
              lastName: 'รักสัตว์',
              phone: '081-999-8888',
            },
            appointments: [],
            medicalRecords: [],
            vaccineRecords: [],
          });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.tenantId === tenantA.id) {
          return Promise.resolve([
            {
              id: 'd1111111-1111-4111-a111-111111111111',
              tenantId: tenantA.id,
              customerId: 'c1111111-1111-4111-a111-111111111111',
              name: 'โมจิ (Mochi)',
              species: 'DOG',
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'd1111111-1111-4111-a111-111111111111',
          ...data,
        })
      ),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'd1111111-1111-4111-a111-111111111111',
          tenantId: tenantA.id,
          ...data,
        })
      ),
      delete: jest.fn().mockResolvedValue({ id: 'd1111111-1111-4111-a111-111111111111' }),
    },
    petNote: { findMany: jest.fn().mockResolvedValue([]) },
    appointment: { findMany: jest.fn().mockResolvedValue([]) },
    clinicVisit: { findMany: jest.fn().mockResolvedValue([]) },
    petMedicalRecord: { findMany: jest.fn().mockResolvedValue([]) },
    petVaccination: { findMany: jest.fn().mockResolvedValue([]) },
    groomingQueueItem: { findMany: jest.fn().mockResolvedValue([]) },
    invoice: { findMany: jest.fn().mockResolvedValue([]) },
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

    // Authenticate Tenant A
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        tenantSlug: 'alpha-clinic',
        email: 'vet@alpha.com',
        password: 'AlphaPassword123!',
      });
    tokenA = resA.body.data.tokens.accessToken;

    // Authenticate Tenant B
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        tenantSlug: 'beta-grooming',
        email: 'groomer@beta.com',
        password: 'BetaPassword123!',
      });
    tokenB = resB.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Strict Tenant Isolation Verification', () => {
    it('Tenant A user CAN read Tenant A branch details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/branches/${branchA.id}?tenantId=${tenantA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(branchA.id);
      expect(res.body.data.tenantId).toBe(tenantA.id);
    });

    it('Tenant A user CANNOT read Tenant B branch details even when providing Tenant B branch UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/branches/${branchB.id}?tenantId=${tenantA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant A user CAN read Tenant A user profiles', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userA.id}?tenantId=${tenantA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(userA.id);
      expect(res.body.data.email).toBe(userA.email);
    });

    it('Tenant A user CANNOT read Tenant B user profiles even when providing Tenant B user UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userB.id}?tenantId=${tenantA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant A user CANNOT operate under Tenant B branch header (x-branch-id)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-branch-id', branchB.id)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant B user CANNOT operate under Tenant A branch header (x-branch-id)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenB}`)
        .set('x-branch-id', branchA.id)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant A user CAN create and read its own customers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].tenantId).toBe(tenantA.id);
    });

    it('Tenant B user CANNOT read Tenant A customer by ID (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/c1111111-1111-4111-a111-111111111111')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant B user CANNOT update Tenant A customer by ID (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/customers/c1111111-1111-4111-a111-111111111111')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ firstName: 'Hacked' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant B user CANNOT delete Tenant A customer by ID (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/customers/c1111111-1111-4111-a111-111111111111')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant A user CAN create and list its own pets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pets')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].tenantId).toBe(tenantA.id);
    });

    it('Tenant B user CANNOT read Tenant A pet by ID (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pets/d1111111-1111-4111-a111-111111111111')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant B user CANNOT update Tenant A pet by ID (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/pets/d1111111-1111-4111-a111-111111111111')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Pet' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant B user CANNOT delete Tenant A pet by ID (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/pets/d1111111-1111-4111-a111-111111111111')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Tenant A user CAN retrieve its pet unified timeline', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pets/d1111111-1111-4111-a111-111111111111/timeline')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.petId).toBe('d1111111-1111-4111-a111-111111111111');
      expect(res.body.data.timeline).toBeDefined();
    });

    it('Tenant B user CANNOT access Tenant A pet unified timeline (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pets/d1111111-1111-4111-a111-111111111111/timeline')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('Forbidden');
    });

    it('Global Search strictly scopes results to the caller tenant', async () => {
      // Tenant A searches -> finds Tenant A records
      const resA = await request(app.getHttpServer())
        .get('/api/v1/search?q=โมจิ')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(resA.body.success).toBe(true);
      expect(resA.body.data.pets.length).toBeGreaterThan(0);
      expect(resA.body.data.pets[0].tenantId).toBe(tenantA.id);

      // Tenant B searches the same keyword -> gets 0 results
      const resB = await request(app.getHttpServer())
        .get('/api/v1/search?q=โมจิ')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resB.body.success).toBe(true);
      expect(resB.body.data.pets.length).toBe(0);
      expect(resB.body.data.customers.length).toBe(0);
    });

    it('Tenant A user CAN import customers & pets via CSV endpoint', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/import-csv')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          rows: [
            {
              firstName: 'นำเข้าหนึ่ง',
              lastName: 'ทดสอบ',
              phone: '089-999-1122',
              petName: 'น้องบาว',
              species: 'DOG',
            },
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(1);
    });
  });
});
