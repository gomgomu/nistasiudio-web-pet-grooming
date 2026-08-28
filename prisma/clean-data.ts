import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('🧹 Starting database cleanup (Wiping all data EXCEPT users, branches, and tenants)...');

  try {
    // 1. Marketing & Notifications
    console.log(' - Deleting Notifications & Campaigns...');
    await prisma.lineInboundMessage.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.notificationTemplate.deleteMany({});
    await prisma.campaign.deleteMany({});

    // 2. Billing, Invoices & POS
    console.log(' - Deleting Payments, Invoice Items & Invoices...');
    await prisma.payment.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});

    // 3. Inventory & Products
    console.log(' - Deleting Inventory Transactions, Lots & Products...');
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.productLot.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.productCategory.deleteMany({});

    // 4. Clinical OPD, Prescriptions, Vaccines
    console.log(' - Deleting Clinical Visits, Prescriptions, Attachments & Vaccines...');
    await prisma.clinicAttachment.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.petVaccination.deleteMany({});
    await prisma.clinicVisit.deleteMany({});

    // 5. Grooming & Appointments
    console.log(' - Deleting Grooming Queue, Photos & Appointments...');
    await prisma.groomingPhoto.deleteMany({});
    await prisma.groomingQueueItem.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.blockedTime.deleteMany({});

    // 6. Staff Shifts, Leaves & Commissions (Keeping User & StaffProfile)
    console.log(' - Deleting Staff Schedules, Leaves & Commissions...');
    await prisma.staffCommission.deleteMany({});
    await prisma.staffLeave.deleteMany({});
    await prisma.staffSchedule.deleteMany({});

    // 7. Services & Categories
    console.log(' - Deleting Services & Pricing Rules...');
    await prisma.servicePriceRule.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.serviceCategory.deleteMany({});

    // 8. Tags, Consents, Pets & Customers
    console.log(' - Deleting Pets, Grooming Profiles, Consents & Customers...');
    await prisma.groomingProfile.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.consent.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.customer.deleteMany({});

    // 9. Usage & Audit Logs
    console.log(' - Deleting Audit Logs & Usage Records...');
    await prisma.auditLog.deleteMany({});
    await prisma.tenantUsageRecord.deleteMany({});
    await prisma.tenantUsageSummary.deleteMany({});

    console.log('---------------------------------------------------------');
    console.log('✨ SUCCESS: All transactional data wiped clean!');
    console.log('👥 Preserved Accounts in Database:');

    const users = await prisma.user.findMany({
      include: {
        tenant: true,
        staffProfile: true,
      },
    });

    users.forEach((u) => {
      console.log(`  • [${u.role}] ${u.email} (${u.firstName} ${u.lastName}) | Tenant: ${u.tenant.name}`);
    });

    console.log('---------------------------------------------------------');
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
