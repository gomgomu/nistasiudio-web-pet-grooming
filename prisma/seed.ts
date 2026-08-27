import { PrismaClient, BusinessType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-pet-clinic' },
    update: {},
    create: {
      name: 'Demo Pet Care Clinic & Grooming',
      slug: 'demo-pet-clinic',
      businessType: BusinessType.HYBRID_CLINIC_GROOMING,
      phone: '02-123-4567',
      email: 'contact@demopetcare.com',
      timezone: 'Asia/Bangkok',
    },
  });

  // Create primary branch
  const branch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'MAIN',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'สำนักงานใหญ่ (Main Branch)',
      code: 'MAIN',
      address: '123 Sukhumvit Rd, Bangkok, Thailand',
      phone: '02-123-4567',
    },
  });

  // Create tenant owner
  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'owner@demopetcare.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@demopetcare.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$demo$placeholder', // Placeholder hash
      firstName: 'สมชาย',
      lastName: 'รักสัตว์',
      role: UserRole.TENANT_OWNER,
      phone: '081-234-5678',
      userBranches: {
        create: {
          branchId: branch.id,
        },
      },
    },
  });

  console.log(`✅ Seed completed successfully for tenant: ${tenant.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
