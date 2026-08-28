import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function harmonizeUsers() {
  console.log('🔄 Harmonizing 4 primary users in Neon PostgreSQL...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Remove legacy/receptionist user if exists
  await prisma.userBranch.deleteMany({
    where: { user: { email: 'reception@demopetcare.com' } },
  });
  await prisma.user.deleteMany({
    where: { email: 'reception@demopetcare.com' },
  });

  // Ensure Demo Tenant & Branch exist
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-pet-clinic' },
    update: { name: 'Demo Pet Care Clinic & Grooming' },
    create: {
      name: 'Demo Pet Care Clinic & Grooming',
      slug: 'demo-pet-clinic',
      phone: '02-123-4567',
      email: 'contact@demopetcare.com',
    },
  });

  const demoBranch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'MAIN',
      },
    },
    update: { name: 'สาขาทองหล่อ (Main Branch)' },
    create: {
      tenantId: demoTenant.id,
      code: 'MAIN',
      name: 'สาขาทองหล่อ (Main Branch)',
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
    },
  });

  // 1. Owner
  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'owner@demopetcare.com',
      },
    },
    update: {
      firstName: 'สมชาย',
      lastName: 'รักสัตว์',
      passwordHash,
      role: UserRole.TENANT_OWNER,
    },
    create: {
      tenantId: demoTenant.id,
      email: 'owner@demopetcare.com',
      passwordHash,
      firstName: 'สมชาย',
      lastName: 'รักสัตว์',
      role: UserRole.TENANT_OWNER,
      phone: '081-234-5678',
      userBranches: { create: { branchId: demoBranch.id } },
    },
  });

  // 2. Groomer
  const groomer = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'groomer@demopetcare.com',
      },
    },
    update: {
      firstName: 'เอกชัย',
      lastName: 'สกิลทอง',
      passwordHash,
      role: UserRole.GROOMER,
    },
    create: {
      tenantId: demoTenant.id,
      email: 'groomer@demopetcare.com',
      passwordHash,
      firstName: 'เอกชัย',
      lastName: 'สกิลทอง',
      role: UserRole.GROOMER,
      phone: '083-456-7890',
      userBranches: { create: { branchId: demoBranch.id } },
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: groomer.id },
    update: { nickname: 'ช่างเอก' },
    create: {
      tenantId: demoTenant.id,
      userId: groomer.id,
      nickname: 'ช่างเอก',
      staffType: 'GROOMER',
      colorCode: '#10B981',
      isBookable: true,
    },
  });

  // 3. Veterinarian
  const vet = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'vet@demopetcare.com',
      },
    },
    update: {
      firstName: 'น้ำใส',
      lastName: 'ใจดี',
      passwordHash,
      role: UserRole.VETERINARIAN,
    },
    create: {
      tenantId: demoTenant.id,
      email: 'vet@demopetcare.com',
      passwordHash,
      firstName: 'น้ำใส',
      lastName: 'ใจดี',
      role: UserRole.VETERINARIAN,
      phone: '084-567-8901',
      userBranches: { create: { branchId: demoBranch.id } },
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: vet.id },
    update: { nickname: 'หมอน้ำใส' },
    create: {
      tenantId: demoTenant.id,
      userId: vet.id,
      nickname: 'หมอน้ำใส',
      staffType: 'VETERINARIAN',
      licenseNumber: 'VET-TH-2024-9988',
      colorCode: '#8B5CF6',
      isBookable: true,
    },
  });

  // 4. Platform Super Admin (DEV)
  const hqTenant = await prisma.tenant.upsert({
    where: { slug: 'petflow-hq' },
    update: {},
    create: {
      name: 'PetFlow Platform HQ',
      slug: 'petflow-hq',
      email: 'admin@petflow.co',
    },
  });

  const hqBranch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: hqTenant.id,
        code: 'HQ',
      },
    },
    update: {},
    create: {
      tenantId: hqTenant.id,
      code: 'HQ',
      name: 'SaaS Headquarter (Platform Control)',
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: hqTenant.id,
        email: 'admin@petflow.co',
      },
    },
    update: {
      firstName: 'PetFlow',
      lastName: 'Super Admin',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      tenantId: hqTenant.id,
      email: 'admin@petflow.co',
      passwordHash,
      firstName: 'PetFlow',
      lastName: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      userBranches: { create: { branchId: hqBranch.id } },
    },
  });

  console.log('---------------------------------------------------------');
  console.log('✅ DATABASE CLEANED & 4 USERS READY:');
  const finalUsers = await prisma.user.findMany({
    include: { tenant: true, staffProfile: true },
  });

  finalUsers.forEach((u) => {
    console.log(`  • [${u.role}] ${u.email} | ${u.firstName} ${u.lastName} (${u.staffProfile?.nickname || 'N/A'}) | Tenant: ${u.tenant.name}`);
  });
  console.log('---------------------------------------------------------');
}

harmonizeUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
