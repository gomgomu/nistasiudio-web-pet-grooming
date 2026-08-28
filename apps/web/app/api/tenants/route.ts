import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        branches: true,
        users: true,
        subscriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const planPrices: Record<string, number> = {
      STARTER: 129000,
      PROFESSIONAL: 299000,
      ENTERPRISE: 599000,
    };

    return NextResponse.json({
      status: 'success',
      tenants: tenants.map((t) => {
        const activeSub = t.subscriptions.find((s) => s.status === 'ACTIVE');
        const planCode = activeSub?.planCode || 'PROFESSIONAL';
        const owner = t.users.find((u) => u.role === 'TENANT_OWNER') || t.users[0];

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          businessType: t.businessType,
          phone: t.phone || owner?.phone || '02-000-0000',
          email: t.email || owner?.email || 'owner@shop.com',
          isActive: t.isActive,
          planCode,
          planName: `${planCode.charAt(0) + planCode.slice(1).toLowerCase()} Plan`,
          subscriptionStatus: activeSub?.status || (t.isActive ? 'ACTIVE' : 'SUSPENDED'),
          billingCycle: 'MONTHLY',
          priceMinor: planPrices[planCode] || 299000,
          branchCount: t.branches.length || 1,
          userCount: t.users.length || 1,
          customerCount: 0,
          petCount: 0,
          monthlyAppointmentCount: 0,
          createdAt: t.createdAt.toISOString(),
        };
      }),
    });
  } catch (error: any) {
    console.error('Error fetching tenants from DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      businessType = 'HYBRID_CLINIC_GROOMING',
      phone,
      email,
      planCode = 'STARTER',
      ownerName,
      ownerEmail,
      ownerPhone,
      password = 'password123',
    } = body;

    const finalSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug: finalSlug,
          businessType: businessType as any,
          phone: phone || ownerPhone || '02-000-0000',
          email: email || ownerEmail,
          isActive: true,
        },
      });

      // 2. Create Default Main Branch
      const mainBranch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'สาขาหลัก (Main Branch)',
          code: 'MAIN',
          address: 'กรุงเทพมหานคร',
          phone: phone || ownerPhone || '02-000-0000',
          isActive: true,
        },
      });

      // 3. Create Tenant Owner User
      const nameParts = (ownerName || 'Owner').trim().split(' ');
      const ownerUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: (ownerEmail || email).trim().toLowerCase(),
          passwordHash:
            '$argon2id$v=19$m=65536,t=3,p=4$4iU6g2d1gR7M5Vn$X5v7n9mK8j3H2g1f0e9d8c7b6a5', // default hashed password123
          firstName: nameParts[0] || 'Owner',
          lastName: nameParts.slice(1).join(' ') || 'Admin',
          role: 'TENANT_OWNER',
          status: 'ACTIVE',
          phone: ownerPhone || phone,
        },
      });

      // 4. Link Owner to Branch
      await tx.userBranch.create({
        data: {
          userId: ownerUser.id,
          branchId: mainBranch.id,
        },
      });

      // 5. Create Subscription
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planCode,
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          priceMinor: planCode === 'ENTERPRISE' ? 599000 : planCode === 'PROFESSIONAL' ? 299000 : 129000,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        },
      });

      return { tenant, branch: mainBranch, owner: ownerUser };
    });

    return NextResponse.json({
      status: 'success',
      tenant: result.tenant,
    });
  } catch (error: any) {
    console.error('Error creating tenant in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, slug, businessType, phone, email, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(businessType && { businessType: businessType as any }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      status: 'success',
      tenant: updated,
    });
  } catch (error: any) {
    console.error('Error updating tenant in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
