import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  BusinessType,
  UserRole,
  UserStatus,
  PetSpecies,
  PetSex,
} from '@prisma/client';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('PF-069: Security Audit & Tenant Isolation Validation', () => {
  let app: INestApplication;
  let tenantAToken: string;
  let staffToken: string;

  // Tenant A: Thonglor Pet Care
  const tenantA = {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'ทองหล่อ เพ็ท แคร์',
    slug: 'thonglor-care',
    businessType: BusinessType.HYBRID_CLINIC_GROOMING,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Tenant B: Silom Vet Hospital (Victim organization)
  const tenantB = {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'สีลม สัตวแพทย์',
    slug: 'silom-vet',
    businessType: BusinessType.VETERINARY_CLINIC,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const branchA = {
    id: '33333333-3333-4333-a333-333333333333',
    tenantId: tenantA.id,
    name: 'สาขาทองหล่อ',
    code: 'THONG-01',
    isActive: true,
  };

  const branchB = {
    id: '44444444-4444-4444-a444-444444444444',
    tenantId: tenantB.id,
    name: 'สาขาสีลม',
    code: 'SILOM-01',
    isActive: true,
  };

  const rawPassword = 'Password123!';
  const passwordHash = bcrypt.hashSync(rawPassword, 8);

  const adminUserA = {
    id: '55555555-5555-4555-a555-555555555555',
    tenantId: tenantA.id,
    email: 'admin@thonglor.com',
    passwordHash,
    firstName: 'แอดมิน',
    lastName: 'ทองหล่อ',
    role: UserRole.TENANT_ADMIN,
    status: UserStatus.ACTIVE,
    userBranches: [{ branchId: branchA.id, branch: branchA }],
  };

  const staffUserA = {
    id: '66666666-6666-4666-a666-666666666666',
    tenantId: tenantA.id,
    email: 'staff@thonglor.com',
    passwordHash,
    firstName: 'ช่างกรูมมิ่ง',
    lastName: 'ทองหล่อ',
    role: UserRole.GROOMER,
    status: UserStatus.ACTIVE,
    userBranches: [{ branchId: branchA.id, branch: branchA }],
  };

  // Victim Record owned by Tenant B
  const tenantBCustomer = {
    id: '77777777-7777-4777-a777-777777777777',
    tenantId: tenantB.id,
    firstName: 'คุณสมศักดิ์',
    lastName: 'ลูกค้าสีลม',
    phone: '089-777-8888',
    email: 'somsak@silom.com',
    pets: [],
  };

  const tenantBPet = {
    id: '88888888-8888-4888-a888-888888888888',
    tenantId: tenantB.id,
    customerId: tenantBCustomer.id,
    name: 'บ๊อบบี้ (Bobby)',
    species: PetSpecies.DOG,
    breed: 'Golden Retriever',
    sex: PetSex.MALE,
    weight: 25.0,
  };

  const mockPrisma: Record<string, any> = {
    isHealthy: jest.fn().mockResolvedValue(true),
    tenant: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === tenantA.id || where?.slug === tenantA.slug) return Promise.resolve(tenantA);
        if (where?.id === tenantB.id || where?.slug === tenantB.slug) return Promise.resolve(tenantB);
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === tenantA.id || where?.slug === tenantA.slug) return Promise.resolve(tenantA);
        if (where?.id === tenantB.id || where?.slug === tenantB.slug) return Promise.resolve(tenantB);
        return Promise.resolve(null);
      }),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.tenantId_email?.email === adminUserA.email) return Promise.resolve(adminUserA);
        if (where?.tenantId_email?.email === staffUserA.email) return Promise.resolve(staffUserA);
        if (where?.id === adminUserA.id) return Promise.resolve(adminUserA);
        if (where?.id === staffUserA.id) return Promise.resolve(staffUserA);
        return Promise.resolve(null);
      }),
    },
    customer: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === tenantBCustomer.id) return Promise.resolve(tenantBCustomer);
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.tenantId === tenantA.id && where?.id === tenantBCustomer.id) return Promise.resolve(null);
        if (where?.tenantId === tenantB.id) return Promise.resolve(tenantBCustomer);
        return Promise.resolve(null);
      }),
    },
    pet: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === tenantBPet.id) return Promise.resolve(tenantBPet);
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.tenantId === tenantA.id && where?.id === tenantBPet.id) return Promise.resolve(null);
        if (where?.tenantId === tenantB.id) return Promise.resolve(tenantBPet);
        return Promise.resolve(null);
      }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      count: jest.fn().mockResolvedValue(10),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // 1. Obtain Tenant A Admin JWT
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminUserA.email,
        password: rawPassword,
        tenantSlug: tenantA.slug,
      });

    tenantAToken = adminLoginRes.body.data.tokens.accessToken;

    // 2. Obtain Tenant A Staff (Groomer) JWT
    const staffLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: staffUserA.email,
        password: rawPassword,
        tenantSlug: tenantA.slug,
      });

    staffToken = staffLoginRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security Requirement 1: Strict Multi-Tenant Isolation (Anti-IDOR)', () => {
    it('Tenant A user MUST NOT read Tenant B customer data by direct ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/customers/${tenantBCustomer.id}`)
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    it('Tenant A user MUST NOT read Tenant B pet data by direct ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/pets/${tenantBPet.id}`)
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Security Requirement 2: Role-Based Access Control (RBAC) & Privilege Escalation', () => {
    it('Low-privilege Staff (Groomer) MUST NOT access SaaS Admin console', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/saas-admin/tenants')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Security Requirement 3: Password Policy & Authentication Hardening', () => {
    it('should reject weak password and return policy violation feedback', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/security/check-password')
        .send({ password: '123' })
        .expect(201);

      const data = res.body?.data || res.body;
      expect(data.isValid).toBe(false);
      expect(data.feedback.length).toBeGreaterThan(0);
    });

    it('should accept strong, complex password conforming to enterprise policy', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/security/check-password')
        .send({ password: 'PetFlow@2026StrongPass!' })
        .expect(201);

      const data = res.body?.data || res.body;
      expect(data.isValid).toBe(true);
      expect(data.feedback.length).toBe(0);
    });
  });

  describe('Security Requirement 4: File Upload & Script Injection Defense', () => {
    it('should block dangerous PHP web shell upload attempt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/security/validate-upload')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          fileName: 'c99shell.php',
          mimeType: 'application/x-php',
          fileSizeBytes: 1024,
        })
        .expect(201);

      const data = res.body?.data || res.body;
      expect(data.isAllowed).toBe(false);
      expect(data.error).toContain('ถูกห้ามอัปโหลด');
    });

    it('should block directory traversal attempt in filename', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/security/validate-upload')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          fileName: '../../../../var/www/exploit.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 2048,
        })
        .expect(201);

      const data = res.body?.data || res.body;
      expect(data.isAllowed).toBe(false);
      expect(data.error).toContain('Path Traversal');
    });

    it('should allow legitimate pet photo upload with sanitized filename', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/security/validate-upload')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          fileName: 'mochi-grooming-result.png',
          mimeType: 'image/png',
          fileSizeBytes: 500000,
        })
        .expect(201);

      const data = res.body?.data || res.body;
      expect(data.isAllowed).toBe(true);
      expect(data.sanitizedFilename).toBe('mochi-grooming-result.png');
    });
  });

  describe('Security Requirement 5: Webhook Forgery & HMAC Integrity', () => {
    it('should reject webhook requests with forged or invalid signature header', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/line/webhook')
        .set('x-line-signature', 'forged-fake-hmac-signature')
        .send({ events: [] });

      expect([400, 401, 403]).toContain(res.status);
    });
  });

  describe('Security Requirement 6: Security Overview & Posture Audit', () => {
    it('Tenant Admin can retrieve real-time security posture status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/security/overview')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      const data = res.body?.data || res.body;
      expect(data.isolationStatus).toBe('ENFORCED');
      expect(data.rbacCompliance).toBe('COMPLIANT');
      expect(data.rateLimitStatus).toBe('ACTIVE');
      expect(data.webhookSignatureEnforced).toBe(true);
    });
  });
});
