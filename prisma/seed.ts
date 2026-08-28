import {
  PrismaClient,
  BusinessType,
  UserRole,
  UserStatus,
  StaffType,
  PetSpecies,
  PetSex,
  MarketingStatus,
  GroomingQueueStatus,
  AppointmentStatus,
  AppointmentSource,
  InvoiceStatus,
  InvoiceItemType,
  PaymentMethodType,
  InventoryTransactionType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for PetFlow...');

  // 1. Password hash for all demo users (password: 'password123')
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);

  // 1.5 Create Platform HQ Tenant & Super Admin User (DEV Admin)
  const hqTenant = await prisma.tenant.upsert({
    where: { slug: 'petflow-hq' },
    update: {},
    create: {
      name: 'PetFlow Platform HQ',
      slug: 'petflow-hq',
      businessType: BusinessType.HYBRID_CLINIC_GROOMING,
      phone: '02-000-0000',
      email: 'admin@petflow.co',
      timezone: 'Asia/Bangkok',
      isActive: true,
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
      name: 'SaaS Headquarter (Platform Control)',
      code: 'HQ',
      address: 'PetFlow Cloud HQ Tower, Bangkok',
      isActive: true,
    },
  });

  const superAdminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: hqTenant.id,
        email: 'admin@petflow.co',
      },
    },
    update: { passwordHash: commonPasswordHash },
    create: {
      tenantId: hqTenant.id,
      email: 'admin@petflow.co',
      passwordHash: commonPasswordHash,
      firstName: 'PetFlow',
      lastName: 'Super Admin (DEV)',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      phone: '080-000-0000',
      userBranches: {
        create: {
          branchId: hqBranch.id,
        },
      },
    },
  });

  // 2. Create demo tenant
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
      isActive: true,
    },
  });

  // 3. Create primary branch
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
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      phone: '02-123-4567',
      isActive: true,
    },
  });

  // 4. Create Demo Users (Owner, Groomer, Veterinarian)
  const ownerUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'owner@demopetcare.com',
      },
    },
    update: { passwordHash: commonPasswordHash },
    create: {
      tenantId: tenant.id,
      email: 'owner@demopetcare.com',
      passwordHash: commonPasswordHash,
      firstName: 'สมชาย',
      lastName: 'รักสัตว์ (เจ้าของร้าน)',
      role: UserRole.TENANT_OWNER,
      status: UserStatus.ACTIVE,
      phone: '081-234-5678',
      userBranches: {
        create: {
          branchId: branch.id,
        },
      },
    },
  });

  const groomerUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'groomer@demopetcare.com',
      },
    },
    update: { passwordHash: commonPasswordHash },
    create: {
      tenantId: tenant.id,
      email: 'groomer@demopetcare.com',
      passwordHash: commonPasswordHash,
      firstName: 'เอกชัย',
      lastName: 'สกิลทอง (ช่างกรูมมิ่ง)',
      role: UserRole.GROOMER,
      status: UserStatus.ACTIVE,
      phone: '083-456-7890',
      userBranches: {
        create: {
          branchId: branch.id,
        },
      },
    },
  });

  const vetUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'vet@demopetcare.com',
      },
    },
    update: { passwordHash: commonPasswordHash },
    create: {
      tenantId: tenant.id,
      email: 'vet@demopetcare.com',
      passwordHash: commonPasswordHash,
      firstName: 'น้ำใส',
      lastName: 'ใจดี (สัตวแพทย์)',
      role: UserRole.VETERINARIAN,
      status: UserStatus.ACTIVE,
      phone: '084-567-8901',
      userBranches: {
        create: {
          branchId: branch.id,
        },
      },
    },
  });

  // Staff Profiles
  await prisma.staffProfile.upsert({
    where: { userId: groomerUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: groomerUser.id,
      nickname: 'ช่างเอก',
      staffType: StaffType.GROOMER,
      specialties: ['สุนัขขนยาว', 'ตัดทรงเกาหลี', 'สปาโอโซน'],
      colorCode: '#10B981',
      isBookable: true,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: vetUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: vetUser.id,
      nickname: 'หมอน้ำใส',
      staffType: StaffType.VETERINARIAN,
      specialties: ['อายุรกรรม', 'วัคซีน', 'ทันตกรรมสัตว์'],
      licenseNumber: 'VET-TH-2024-9988',
      colorCode: '#8B5CF6',
      isBookable: true,
    },
  });

  // 5. Service Categories & Services
  const groomingCat = await prisma.serviceCategory.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'กรูมมิ่งและอาบน้ำ (Grooming)',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'กรูมมิ่งและอาบน้ำ (Grooming)',
    },
  });

  const clinicalCat = await prisma.serviceCategory.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'คลินิกและรักษา (Veterinary)',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'คลินิกและรักษา (Veterinary)',
    },
  });

  const fullGroomingService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'อาบน้ำตัดขนสุนัขครบวงจร (Full Grooming)',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      categoryId: groomingCat.id,
      name: 'อาบน้ำตัดขนสุนัขครบวงจร (Full Grooming)',
      category: 'GROOMING',
      durationMinutes: 90,
      basePriceMinor: BigInt(50000), // 500.00 THB
      isActive: true,
    },
  });

  const bathService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'อาบน้ำเป่าขน (Bath & Blow Dry)',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      categoryId: groomingCat.id,
      name: 'อาบน้ำเป่าขน (Bath & Blow Dry)',
      category: 'GROOMING',
      durationMinutes: 45,
      basePriceMinor: BigInt(30000), // 300.00 THB
      isActive: true,
    },
  });

  const checkupService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'ตรวจสุขภาพทั่วไป (General Health Checkup)',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      categoryId: clinicalCat.id,
      name: 'ตรวจสุขภาพทั่วไป (General Health Checkup)',
      category: 'CLINICAL',
      durationMinutes: 30,
      basePriceMinor: BigInt(40000), // 400.00 THB
      isActive: true,
    },
  });

  const vaccineService = await prisma.service.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'ฉีดวัคซีนรวมสุนัข 6 โรค (Dog Core Vaccine)',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      categoryId: clinicalCat.id,
      name: 'ฉีดวัคซีนรวมสุนัข 6 โรค (Dog Core Vaccine)',
      category: 'CLINICAL',
      durationMinutes: 20,
      basePriceMinor: BigInt(35000), // 350.00 THB
      isActive: true,
    },
  });

  // 6. Customers & Pets
  const customer1 = await prisma.customer.upsert({
    where: {
      tenantId_phone: {
        tenantId: tenant.id,
        phone: '081-999-1111',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      firstName: 'ธัญญ่า',
      lastName: 'สุวรรณภูมิ',
      phone: '081-999-1111',
      email: 'thanya@example.com',
      lineUserId: 'U_demo_line_001',
      address: '88/1 ถนนสุขุมวิท กรุงเทพฯ',
      notes: 'ลูกค้าประจำ ชอบให้ตัดขนทรงธรรมชาติ',
      marketingStatus: MarketingStatus.OPTED_IN,
    },
  });

  const pet1 = await prisma.pet.create({
    data: {
      tenantId: tenant.id,
      customerId: customer1.id,
      name: 'เจ้าชาบู',
      species: PetSpecies.DOG,
      breed: 'Golden Retriever',
      sex: PetSex.MALE,
      weight: 28.5,
      allergies: 'แพ้แชมพูสูตรสมุนไพรบางชนิด ระคายเคืองง่าย',
      behavioralNotes: 'นิสัยน่ารักมาก แต่กลัวเสียงไดร์เป่าขนแรงๆ',
      specialRequirements: 'ใช้แชมพูสูตร Hypoallergenic เท่านั้น',
      groomingProfile: {
        create: {
          tenantId: tenant.id,
          preferredCut: 'ทรงกรูมมิ่งธรรมชาติ เล็มปลายขน',
          shampoo: 'Hypoallergenic Oatmeal',
          warnings: 'ระวังผิวหนังแห้งคัน',
          preferredGroomerId: groomerUser.id,
        },
      },
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: {
      tenantId_phone: {
        tenantId: tenant.id,
        phone: '089-888-2222',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      firstName: 'กิตติศักดิ์',
      lastName: 'เจริญสุข',
      phone: '089-888-2222',
      email: 'kittisak@example.com',
      lineUserId: 'U_demo_line_002',
      address: '55/9 ถนนพระราม 9 กรุงเทพฯ',
      marketingStatus: MarketingStatus.OPTED_IN,
    },
  });

  const pet2 = await prisma.pet.create({
    data: {
      tenantId: tenant.id,
      customerId: customer2.id,
      name: 'เจ้าส้มตำ',
      species: PetSpecies.CAT,
      breed: 'British Shorthair',
      sex: PetSex.SPAYED_FEMALE,
      weight: 4.8,
      allergies: 'ไม่มี',
      behavioralNotes: 'ขี้กลัวคนแปลกหน้า ระวังอย่าเสียงดัง',
      groomingProfile: {
        create: {
          tenantId: tenant.id,
          preferredCut: 'อาบน้ำแปรงขนสางสังกะตัง',
          shampoo: 'Cat Gentle Clean',
          warnings: 'ระวังหลุดมือตอนเป่าขน',
        },
      },
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: {
      tenantId_phone: {
        tenantId: tenant.id,
        phone: '086-777-3333',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      firstName: 'อรอนงค์',
      lastName: 'วิทยาการ',
      phone: '086-777-3333',
      email: 'oranon@example.com',
      marketingStatus: MarketingStatus.OPTED_IN,
    },
  });

  const pet3 = await prisma.pet.create({
    data: {
      tenantId: tenant.id,
      customerId: customer3.id,
      name: 'มิลค์กี้',
      species: PetSpecies.DOG,
      breed: 'Poodle Toy',
      sex: PetSex.FEMALE,
      weight: 3.6,
      allergies: 'ไม่มี',
      behavioralNotes: 'ร่าเริง ชอบให้เกาคาง',
      groomingProfile: {
        create: {
          tenantId: tenant.id,
          preferredCut: 'ทรงเท็ดดี้แบร์ (Teddy Bear cut)',
          shampoo: 'Fluffy White Care',
          preferredGroomerId: groomerUser.id,
        },
      },
    },
  });

  // Clean existing demo queue items, appointments, and invoices to allow idempotent re-seed
  await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { tenantId: tenant.id } } });
  await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.groomingQueueItem.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.appointment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.inventoryTransaction.deleteMany({ where: { tenantId: tenant.id } });

  // 7. Active Grooming Queue Items
  await prisma.groomingQueueItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        branchId: branch.id,
        customerId: customer3.id,
        petId: pet3.id,
        serviceId: fullGroomingService.id,
        groomerId: groomerUser.id,
        queueNumber: 1,
        status: GroomingQueueStatus.GROOMING,
        specialCareNotes: 'ตัดทรง Teddy Bear เก็บหน้ากลมๆ',
        estimatedDurationMinutes: 90,
        priceMinor: BigInt(50000),
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        customerId: customer1.id,
        petId: pet1.id,
        serviceId: bathService.id,
        groomerId: groomerUser.id,
        queueNumber: 2,
        status: GroomingQueueStatus.WAITING,
        specialCareNotes: 'ใช้แชมพู Hypoallergenic เท่านั้น',
        estimatedDurationMinutes: 60,
        priceMinor: BigInt(30000),
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        customerId: customer2.id,
        petId: pet2.id,
        serviceId: bathService.id,
        groomerId: groomerUser.id,
        queueNumber: 3,
        status: GroomingQueueStatus.READY,
        specialCareNotes: 'เสร็จแล้ว ส่ง LINE แจ้งเจ้าของมารับ',
        estimatedDurationMinutes: 45,
        priceMinor: BigInt(30000),
      },
    ],
  });

  // 8. Appointments
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      customerId: customer1.id,
      petId: pet1.id,
      serviceId: fullGroomingService.id,
      staffId: groomerUser.id,
      createdById: ownerUser.id,
      startAt: tomorrow,
      endAt: tomorrowEnd,
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.PHONE,
      priceMinor: BigInt(50000),
      notes: 'นัดหมายตัดขนประจำเดือน',
    },
  });

  // 9. Products & Inventory
  const productCat1 = await prisma.productCategory.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'แชมพูและผลิตภัณฑ์ดูแลขน',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'แชมพูและผลิตภัณฑ์ดูแลขน',
    },
  });

  const productCat2 = await prisma.productCategory.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'ขนมและอาหารสัตว์',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'ขนมและอาหารสัตว์',
    },
  });

  const product1 = await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: 'SHP-HYPO-01',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: productCat1.id,
      sku: 'SHP-HYPO-01',
      barcode: '8851234567890',
      name: 'แชมพูสูตรอ่อนโยน Hypoallergenic Oatmeal (500ml)',
      unit: 'ขวด',
      costMinor: BigInt(22000), // 220.00 THB
      salePriceMinor: BigInt(45000), // 450.00 THB
      reorderPoint: 5,
      isActive: true,
      description: 'แชมพูสูตรสารสกัดโอ๊ตมีลธรรมชาติ ลดอาการคันระคายเคือง',
    },
  });

  const product2 = await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: 'TRT-DENT-01',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: productCat2.id,
      sku: 'TRT-DENT-01',
      barcode: '8859876543210',
      name: 'ขนมขัดฟันสุนัขรสเนื้อ Dental Chew (150g)',
      unit: 'ถุง',
      costMinor: BigInt(6000), // 60.00 THB
      salePriceMinor: BigInt(12000), // 120.00 THB
      reorderPoint: 10,
      isActive: true,
      description: 'ช่วยลดคราบหินปูนและกลิ่นปาก',
    },
  });

  // Create Inventory Transactions
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        branchId: branch.id,
        productId: product1.id,
        type: InventoryTransactionType.IN,
        quantity: 30,
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        productId: product2.id,
        type: InventoryTransactionType.IN,
        quantity: 50,
      },
    ],
  });

  // 10. Sample Completed Invoice & Payment (POS test)
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      customerId: customer1.id,
      petId: pet1.id,
      invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`,
      status: InvoiceStatus.PAID,
      subtotalMinor: BigInt(57000),
      discountMinor: BigInt(0),
      taxMinor: BigInt(0),
      totalMinor: BigInt(57000),
      paidAmountMinor: BigInt(57000),
      issuedById: ownerUser.id,
      paidAt: new Date(),
      items: {
        create: [
          {
            itemType: InvoiceItemType.SERVICE,
            serviceId: fullGroomingService.id,
            description: 'อาบน้ำตัดขนสุนัขครบวงจร (Full Grooming)',
            quantity: 1,
            unitPriceMinor: BigInt(50000),
            discountMinor: BigInt(0),
            totalMinor: BigInt(50000),
            staffId: groomerUser.id,
          },
          {
            itemType: InvoiceItemType.PRODUCT,
            productId: product2.id,
            description: 'ขนมขัดฟันสุนัขรสเนื้อ Dental Chew (150g)',
            quantity: 1,
            unitPriceMinor: BigInt(12000),
            discountMinor: BigInt(5000),
            totalMinor: BigInt(7000),
          },
        ],
      },
      payments: {
        create: {
          tenantId: tenant.id,
          branchId: branch.id,
          method: PaymentMethodType.PROMPTPAY,
          amountMinor: BigInt(57000),
          receivedAmountMinor: BigInt(57000),
          changeMinor: BigInt(0),
          reference: 'PPAY-984321',
          recordedById: ownerUser.id,
          paidAt: new Date(),
        },
      },
    },
  });

  console.log('---------------------------------------------------------');
  console.log('✅ Comprehensive Seed completed successfully!');
  console.log('🛡️ Platform HQ: ', hqTenant.name, `(${hqTenant.slug})`);
  console.log('🏢 Demo Tenant: ', tenant.name, `(${tenant.slug})`);
  console.log('📍 Main Branch: ', branch.name, `(${branch.code})`);
  console.log('👥 Standard Users (Password for all: password123):');
  console.log('  👑 Owner:        owner@demopetcare.com');
  console.log('  🛡️ Super Admin:  admin@petflow.co');
  console.log('  ✂️ Groomer:      groomer@demopetcare.com');
  console.log('  🩺 Veterinarian: vet@demopetcare.com');
  console.log('🧾 Created Sample Invoice:', invoice.invoiceNo);
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
