import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export async function exportTenantData(tenantId: string, outputPath?: string) {
  console.log(`[Tenant Export] Exporting full data for Tenant UUID: ${tenantId}`);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      branches: true,
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      customers: {
        include: {
          pets: {
            include: {
              groomingProfiles: true,
              vaccinations: true,
              clinicVisits: true,
            },
          },
        },
      },
      services: {
        include: {
          priceRules: true,
        },
      },
      appointments: true,
      groomingQueueItems: true,
      invoices: {
        include: {
          items: true,
          payments: true,
        },
      },
      products: {
        include: {
          lots: true,
          inventoryTransactions: true,
        },
      },
      subscriptions: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found.`);
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    tenant,
  };

  const finalPath = outputPath || path.resolve(process.cwd(), `backups/tenant_${tenantId}_${Date.now()}.json`);
  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(finalPath, JSON.stringify(exportPayload, null, 2), 'utf-8');
  console.log(`[Tenant Export] Export saved successfully to: ${finalPath}`);

  return {
    success: true,
    tenantId,
    filePath: finalPath,
    customersCount: tenant.customers.length,
    invoicesCount: tenant.invoices.length,
    exportedAt: exportPayload.exportedAt,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const tenantIdArg = args.find((a) => a.startsWith('--tenant-id='))?.split('=')[1];
  const outputArg = args.find((a) => a.startsWith('--output='))?.split('=')[1];

  if (!tenantIdArg) {
    console.error('Usage: ts-node scripts/tenant-export.ts --tenant-id=<UUID> [--output=<path>]');
    process.exit(1);
  }

  exportTenantData(tenantIdArg, outputArg)
    .then(() => {
      prisma.$disconnect();
    })
    .catch((err) => {
      console.error(`[Export Error] ${err.message}`);
      prisma.$disconnect();
      process.exit(1);
    });
}
