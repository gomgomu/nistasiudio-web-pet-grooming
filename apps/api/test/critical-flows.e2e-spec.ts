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
  AppointmentStatus,
  GroomingQueueStatus,
  InvoiceStatus,
  PaymentMethodType,
  VaccineType,
  UsageMetricType,
} from '@prisma/client';

// Enable JSON serialization for BigInt in Jest tests
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

describe('PF-068: Critical E2E Business Flows (End-to-End)', () => {
  let app: INestApplication;
  let jwtToken: string;

  const mockTenant = {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'ทองหล่อ เพ็ท แคร์ แอนด์ กรูมมิ่ง',
    slug: 'thonglor-petcare',
    businessType: BusinessType.HYBRID_CLINIC_GROOMING,
    phone: '02-123-4567',
    email: 'admin@thonglorpetcare.com',
    timezone: 'Asia/Bangkok',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBranch = {
    id: '22222222-2222-4222-a222-222222222222',
    tenantId: mockTenant.id,
    name: 'สาขาทองหล่อ (Main)',
    code: 'MAIN',
    address: '123 สุขุมวิท 55',
    phone: '02-123-4567',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPassword = 'Password123!';
  const mockPasswordHash = bcrypt.hashSync(mockPassword, 8);

  const mockUser = {
    id: '33333333-3333-4333-a333-333333333333',
    tenantId: mockTenant.id,
    email: 'receptionist@thonglorpetcare.com',
    passwordHash: mockPasswordHash,
    firstName: 'สมศรี',
    lastName: 'บริการดี',
    role: UserRole.TENANT_ADMIN,
    status: UserStatus.ACTIVE,
    phone: '089-111-2222',
    createdAt: new Date(),
    updatedAt: new Date(),
    userBranches: [
      {
        branchId: mockBranch.id,
        branch: { id: mockBranch.id, name: mockBranch.name, code: mockBranch.code },
      },
    ],
  };

  const mockCustomer = {
    id: '44444444-4444-4444-a444-444444444444',
    tenantId: mockTenant.id,
    firstName: 'กิตติศักดิ์',
    lastName: 'รักสัตว์',
    phone: '081-999-8888',
    email: 'kittisak@example.com',
    lineId: 'kittisak_line',
    createdAt: new Date(),
    updatedAt: new Date(),
    pets: [],
  };

  const mockPet = {
    id: '55555555-5555-4555-a555-555555555555',
    tenantId: mockTenant.id,
    customerId: mockCustomer.id,
    name: 'โมจิ (Mochi)',
    species: PetSpecies.DOG,
    breed: 'Pomeranian',
    sex: PetSex.SPAYED_FEMALE,
    weightKg: 3.5,
    microchipNo: 'TH-99887766',
    allergies: 'แพ้ไก่',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: mockCustomer,
  };

  const mockService = {
    id: '66666666-6666-4666-a666-666666666666',
    tenantId: mockTenant.id,
    name: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming)',
    code: 'GROOM-S',
    durationMinutes: 90,
    priceMinor: BigInt(65000), // 650 THB
    isActive: true,
  };

  const mockAppointment = {
    id: '77777777-7777-4777-a777-777777777777',
    tenantId: mockTenant.id,
    branchId: mockBranch.id,
    customerId: mockCustomer.id,
    petId: mockPet.id,
    serviceId: mockService.id,
    staffId: mockUser.id,
    status: AppointmentStatus.CONFIRMED,
    startAt: new Date(Date.now() + 3600000),
    endAt: new Date(Date.now() + 7200000),
    notes: 'ตัดทรงเท็ดดี้แบร์',
    createdAt: new Date(),
    updatedAt: new Date(),
    pet: mockPet,
    customer: mockCustomer,
    service: mockService,
    branch: mockBranch,
    staff: mockUser,
  };

  const mockQueueItem = {
    id: '88888888-8888-4888-a888-888888888888',
    tenantId: mockTenant.id,
    branchId: mockBranch.id,
    petId: mockPet.id,
    customerId: mockCustomer.id,
    appointmentId: mockAppointment.id,
    status: GroomingQueueStatus.WAITING,
    queueNumber: 1,
    checkInTime: new Date(),
    specialCareNotes: 'น้องขี้กลัวนิดหน่อย',
    pet: mockPet,
    customer: mockCustomer,
    service: mockService,
    groomer: mockUser,
    appointment: mockAppointment,
    photos: [],
  };

  const mockClinicVisit = {
    id: '99999999-9999-4999-a999-999999999999',
    tenantId: mockTenant.id,
    branchId: mockBranch.id,
    petId: mockPet.id,
    customerId: mockCustomer.id,
    pet: mockPet,
    customer: mockCustomer,
    veterinarian: mockUser,
    branch: mockBranch,
    followUpDate: new Date(Date.now() + 86400000),
    followUpReason: 'ติดตามอาการหลังฉีดวัคซีน',
  };

  const mockSoapNote = {
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    tenantId: mockTenant.id,
    petId: mockPet.id,
    veterinarianId: mockUser.id,
    subjective: 'เจ้าของพามาตรวจสุขภาพประจำปี',
    objective: 'อุณหภูมิ 38.5C น้ำหนัก 3.5kg',
    assessment: 'สุขภาพแข็งแรงดี พร้อมรับวัคซีน',
    plan: 'ฉีดวัคซีนรวมสุนัข 5 โรค (DHPPi+L)',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVaccination = {
    id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb',
    tenantId: mockTenant.id,
    petId: mockPet.id,
    vaccineName: 'DHPPi + Leptospirosis 5-in-1',
    vaccineType: VaccineType.DOG_CORE_5_IN_1,
    lotNumber: 'LOT-2026-V88',
    manufacturer: 'Zoetis Vanguard Plus 5',
    administeredAt: new Date(),
    nextDueAt: new Date(Date.now() + 365 * 86400000),
    isCompleted: true,
    reminderSent: false,
    reminderSentAt: null,
    certificateNumber: 'VAC-2026-0089',
    createdAt: new Date(),
    pet: mockPet,
    clinicVisit: null,
    administeredBy: mockUser,
  };

  const mockInvoice = {
    id: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
    tenantId: mockTenant.id,
    branchId: mockBranch.id,
    customerId: mockCustomer.id,
    invoiceNo: 'INV-202608-0001',
    status: InvoiceStatus.UNPAID,
    subtotalMinor: BigInt(115000), // 650 (Grooming) + 500 (Vaccine) = 1,150 THB
    discountMinor: BigInt(0),
    taxMinor: BigInt(0),
    totalMinor: BigInt(115000),
    paidAmountMinor: BigInt(0),
    items: [
      {
        id: 'item-1',
        description: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming)',
        unitPriceMinor: BigInt(65000),
        quantity: 1,
        totalMinor: BigInt(65000),
      },
      {
        id: 'item-2',
        description: 'วัคซีนรวมสุนัข 5 โรค (DHPPi+L)',
        unitPriceMinor: BigInt(50000),
        quantity: 1,
        totalMinor: BigInt(50000),
      },
    ],
    customer: mockCustomer,
    pet: mockPet,
    branch: mockBranch,
    payments: [],
    createdAt: new Date(),
    issuedAt: new Date(),
  };

  const mockPayment = {
    id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
    tenantId: mockTenant.id,
    invoiceId: mockInvoice.id,
    amountMinor: BigInt(115000),
    method: PaymentMethodType.PROMPTPAY,
    reference: 'PROMPTPAY-TH-998811',
    paidAt: new Date(),
    invoice: mockInvoice,
    receivedById: mockUser.id,
  };

  const mockPlan = {
    id: 'plan-pro',
    code: 'PROFESSIONAL',
    name: 'Professional Plan',
    description: 'Pro plan for growing business',
    priceMonthlyMinor: BigInt(299000),
    priceYearlyMinor: BigInt(2990000),
    currency: 'THB',
    maxBranches: 3,
    maxStaffUsers: 10,
    maxMonthlyAppointments: 1000,
    hasLineIntegration: true,
    hasAdvancedInventory: true,
    hasClinicalSoap: true,
    hasVaccinationRegistry: true,
    hasCommissionEngine: true,
    hasMultiBranchCentral: true,
    hasApiAccess: true,
    isActive: true,
    sortOrder: 2,
  };

  const mockPrismaService: Record<string, any> = {
    isHealthy: jest.fn().mockResolvedValue(true),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        ...mockTenant,
        subscriptions: [
          {
            id: 'sub-1',
            tenantId: mockTenant.id,
            planId: mockPlan.id,
            planCode: 'PROFESSIONAL',
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            priceMinor: BigInt(299000),
            currency: 'THB',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
            plan: mockPlan,
          },
        ],
      }),
      findMany: jest.fn().mockResolvedValue([mockTenant]),
    },
    branch: {
      findUnique: jest.fn().mockResolvedValue(mockBranch),
      findFirst: jest.fn().mockResolvedValue(mockBranch),
      findMany: jest.fn().mockResolvedValue([mockBranch]),
      count: jest.fn().mockResolvedValue(1),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.tenantId_email && where.tenantId_email.email === mockUser.email) {
          return Promise.resolve(mockUser);
        }
        if (where?.id === mockUser.id) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
      findFirst: jest.fn().mockResolvedValue(mockUser),
      findMany: jest.fn().mockResolvedValue([mockUser]),
      count: jest.fn().mockResolvedValue(1),
    },
    customer: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.tenantId_phone) return Promise.resolve(null);
        if (where?.id === mockCustomer.id) return Promise.resolve(mockCustomer);
        return Promise.resolve(mockCustomer);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === mockCustomer.id) return Promise.resolve(mockCustomer);
        if (where?.phone && where.phone === '081-999-8888' && !where?.id) return Promise.resolve(null);
        return Promise.resolve(mockCustomer);
      }),
      findMany: jest.fn().mockResolvedValue([mockCustomer]),
      create: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn().mockResolvedValue(mockCustomer),
      count: jest.fn().mockResolvedValue(1),
    },
    pet: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === mockPet.id) return Promise.resolve(mockPet);
        return Promise.resolve(mockPet);
      }),
      findFirst: jest.fn().mockResolvedValue(mockPet),
      findMany: jest.fn().mockResolvedValue([mockPet]),
      create: jest.fn().mockResolvedValue(mockPet),
      update: jest.fn().mockResolvedValue(mockPet),
      count: jest.fn().mockResolvedValue(1),
    },
    service: {
      findUnique: jest.fn().mockResolvedValue(mockService),
      findFirst: jest.fn().mockResolvedValue(mockService),
      findMany: jest.fn().mockResolvedValue([mockService]),
    },
    appointment: {
      findUnique: jest.fn().mockResolvedValue(mockAppointment),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([mockAppointment]),
      create: jest.fn().mockResolvedValue(mockAppointment),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ ...mockAppointment, ...data })
      ),
      count: jest.fn().mockResolvedValue(1),
    },
    groomingQueueItem: {
      findUnique: jest.fn().mockResolvedValue(mockQueueItem),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([mockQueueItem]),
      create: jest.fn().mockResolvedValue(mockQueueItem),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ ...mockQueueItem, ...data })
      ),
    },
    clinicVisit: {
      findUnique: jest.fn().mockResolvedValue(mockClinicVisit),
      findFirst: jest.fn().mockResolvedValue(mockClinicVisit),
      findMany: jest.fn().mockResolvedValue([mockClinicVisit]),
      create: jest.fn().mockResolvedValue(mockClinicVisit),
    },
    soapNote: {
      findUnique: jest.fn().mockResolvedValue(mockSoapNote),
      findFirst: jest.fn().mockResolvedValue(mockSoapNote),
      findMany: jest.fn().mockResolvedValue([mockSoapNote]),
      create: jest.fn().mockResolvedValue(mockSoapNote),
      upsert: jest.fn().mockResolvedValue(mockSoapNote),
    },
    petVaccination: {
      findUnique: jest.fn().mockResolvedValue(mockVaccination),
      findFirst: jest.fn().mockResolvedValue(mockVaccination),
      findMany: jest.fn().mockResolvedValue([mockVaccination]),
      create: jest.fn().mockResolvedValue(mockVaccination),
    },
    petMedicalRecord: {
      create: jest.fn().mockResolvedValue({ id: 'mr-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    invoice: {
      findUnique: jest.fn().mockResolvedValue(mockInvoice),
      findFirst: jest.fn().mockResolvedValue(mockInvoice),
      findMany: jest.fn().mockResolvedValue([mockInvoice]),
      create: jest.fn().mockResolvedValue(mockInvoice),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ ...mockInvoice, ...data })
      ),
    },
    payment: {
      findUnique: jest.fn().mockResolvedValue(mockPayment),
      findFirst: jest.fn().mockResolvedValue(mockPayment),
      findMany: jest.fn().mockResolvedValue([mockPayment]),
      create: jest.fn().mockResolvedValue(mockPayment),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    tenantUsageSummary: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const metricType = where?.tenantId_metricType_billingPeriod?.metricType || UsageMetricType.LINE_MESSAGES;
        return Promise.resolve({
          id: `sum-${metricType}`,
          tenantId: mockTenant.id,
          metricType,
          billingPeriod: '2026-08',
          usedQuantity: 10,
          quotaLimit: 2000,
          extraCredits: 0,
          lastWarningThreshold: null,
        });
      }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'sum-1',
        tenantId: mockTenant.id,
        metricType: UsageMetricType.LINE_MESSAGES,
        billingPeriod: '2026-08',
        usedQuantity: 10,
        quotaLimit: 2000,
        extraCredits: 0,
      }),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'sum-1', ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'sum-1', ...data })),
    },
    tenantUsageRecord: {
      create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    subscriptionPlan: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([mockPlan]),
      findUnique: jest.fn().mockResolvedValue(mockPlan),
    },
    subscription: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'sub-1',
        tenantId: mockTenant.id,
        planId: mockPlan.id,
        planCode: 'PROFESSIONAL',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        priceMinor: BigInt(299000),
        plan: mockPlan,
      }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'sub-1',
        tenantId: mockTenant.id,
        planId: mockPlan.id,
        planCode: 'PROFESSIONAL',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        priceMinor: BigInt(299000),
        plan: mockPlan,
      }),
    },
    staffSchedule: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'sched-1',
          tenantId: mockTenant.id,
          userId: mockUser.id,
          dayOfWeek: 'MONDAY',
          startTime: '00:00',
          endTime: '23:59',
          isActive: true,
        },
      ]),
    },
    staffLeave: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    servicePriceRule: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    blockedTime: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    branchOperatingHour: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'oh-1',
        isOpen: true,
        openTime: '00:00',
        closeTime: '23:59',
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'oh-1',
          isOpen: true,
          openTime: '00:00',
          closeTime: '23:59',
        },
      ]),
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Authenticate and obtain JWT
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: mockUser.email,
        password: mockPassword,
        tenantSlug: mockTenant.slug,
      });

    jwtToken = loginRes.body?.data?.tokens?.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Critical Path: Complete Pet Business Lifecycle (Flow 1 to Flow 8)', () => {
    it('Flow 1: Receptionist / Staff Authentication with Tenant Context', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: mockUser.email,
          password: mockPassword,
          tenantSlug: mockTenant.slug,
        })
        .expect(200);

      expect(res.body).toBeDefined();
      const token = res.body.data?.tokens?.accessToken;
      expect(token).toBeDefined();
    });

    it('Flow 2: Register Customer & Pet in CRM', async () => {
      // 2.1 Register Customer
      const customerRes = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          firstName: 'กิตติศักดิ์',
          lastName: 'รักสัตว์',
          phone: '081-999-8888',
          email: 'kittisak@example.com',
          lineUserId: 'U1234567890abcdef',
        })
        .expect(201);

      expect(customerRes.body).toBeDefined();

      // 2.2 Register Pet
      const petRes = await request(app.getHttpServer())
        .post('/api/v1/pets')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          customerId: mockCustomer.id,
          name: 'โมจิ (Mochi)',
          species: PetSpecies.DOG,
          breed: 'Pomeranian',
          sex: PetSex.SPAYED_FEMALE,
          weight: 3.5,
          microchipNumber: 'TH-99887766',
        })
        .expect(201);

      expect(petRes.body).toBeDefined();
    });

    it('Flow 3: Book Grooming & Clinic Appointment', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          branchId: mockBranch.id,
          customerId: mockCustomer.id,
          petId: mockPet.id,
          serviceId: mockService.id,
          staffId: mockUser.id,
          priceMinor: 65000,
          allowConflict: true,
          startAt: new Date(Date.now() + 3600000).toISOString(),
          endAt: new Date(Date.now() + 7200000).toISOString(),
          notes: 'ตัดทรงเท็ดดี้แบร์',
        })
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('Flow 4: Check-in & Grooming Queue Transition Pipeline', async () => {
      // 4.1 Check in appointment
      const checkInRes = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${mockAppointment.id}/status`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          status: AppointmentStatus.CHECKED_IN,
        })
        .expect(200);

      expect(checkInRes.body).toBeDefined();

      // 4.2 Enqueue in grooming station
      const queueRes = await request(app.getHttpServer())
        .post('/api/v1/grooming/queue')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          branchId: mockBranch.id,
          petId: mockPet.id,
          customerId: mockCustomer.id,
          serviceId: mockService.id,
          appointmentId: mockAppointment.id,
          specialCareNotes: 'น้องขี้กลัวนิดหน่อย',
        })
        .expect(201);

      expect(queueRes.body).toBeDefined();

      // 4.3 Advance queue status to READY
      const updateQueueRes = await request(app.getHttpServer())
        .patch(`/api/v1/grooming/queue/${mockQueueItem.id}/status`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          status: GroomingQueueStatus.READY,
        })
        .expect(200);

      expect(updateQueueRes.body).toBeDefined();
    });

    it('Flow 5: Veterinary OPD Examination & Vaccination Record', async () => {
      // 5.1 Administer Vaccine
      const vacRes = await request(app.getHttpServer())
        .post('/api/v1/clinical/vaccinations')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          petId: mockPet.id,
          vaccineName: 'DHPPi + Leptospirosis 5-in-1',
          vaccineType: VaccineType.DOG_CORE_5_IN_1,
          lotNumber: 'LOT-2026-V88',
          manufacturer: 'Zoetis Vanguard Plus 5',
          administeredAt: new Date().toISOString(),
          nextDueAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        })
        .expect(201);

      expect(vacRes.body).toBeDefined();

      // 5.2 List vaccinations
      const vacListRes = await request(app.getHttpServer())
        .get(`/api/v1/clinical/vaccinations?petId=${mockPet.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(vacListRes.body).toBeDefined();
    });

    it('Flow 6: Point of Sale (POS) Multi-Item Invoicing', async () => {
      const invoiceRes = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          branchId: mockBranch.id,
          customerId: mockCustomer.id,
          items: [
            {
              description: 'อาบน้ำตัดขนสุนัขพันธุ์เล็ก (Full Grooming)',
              unitPriceMinor: 65000,
              quantity: 1,
            },
            {
              description: 'วัคซีนรวมสุนัข 5 โรค (DHPPi+L)',
              unitPriceMinor: 50000,
              quantity: 1,
            },
          ],
        })
        .expect(201);

      expect(invoiceRes.body).toBeDefined();
    });

    it('Flow 7: Payment Collection via PromptPay QR & Invoice Settlement', async () => {
      const payRes = await request(app.getHttpServer())
        .post(`/api/v1/invoices/${mockInvoice.id}/payments`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          amountMinor: 115000,
          method: PaymentMethodType.PROMPTPAY,
          reference: 'PROMPTPAY-TH-998811',
        })
        .expect(201);

      expect(payRes.body).toBeDefined();
    });

    it('Flow 8: Automated Follow-up Reminder & Usage Metering Accounting', async () => {
      // 8.1 Dispatch Follow-up Reminder
      const followUpRes = await request(app.getHttpServer())
        .post(`/api/v1/clinical/follow-ups/${mockClinicVisit.id}/send-reminder`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          channel: 'LINE',
          customMessage: 'ติดตามอาการน้องโมจิหลังฉีดวัคซีน 24 ชม.',
        })
        .expect(201);

      expect(followUpRes.body).toBeDefined();

      // 8.2 Verify Usage Metering recorded
      const meterRes = await request(app.getHttpServer())
        .get('/api/v1/usage-metering/current')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(meterRes.body).toBeDefined();
    });
  });
});
