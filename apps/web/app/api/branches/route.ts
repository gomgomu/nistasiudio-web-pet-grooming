import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'demo-pet-clinic';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ branches: [] });
    }

    const branches = await prisma.branch.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        isMain: b.code === 'MAIN',
        address: b.address || '',
        phone: b.phone || '',
        openingHours: '09:00 - 20:00 น. (ทุกวัน)',
        staffCount: 3,
        isActive: b.isActive,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching branches from DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code, address, phone, tenantSlug = 'demo-pet-clinic' } = body;

    let tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      tenant = await prisma.tenant.findFirst();
    }

    if (!tenant) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 }
      );
    }

    const newBranch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name,
        code: (code || `BR-${Date.now().toString().slice(-4)}`).toUpperCase(),
        address,
        phone,
        isActive: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      branch: {
        id: newBranch.id,
        name: newBranch.name,
        code: newBranch.code,
        isMain: newBranch.code === 'MAIN',
        address: newBranch.address || '',
        phone: newBranch.phone || '',
        openingHours: '09:00 - 20:00 น. (ทุกวัน)',
        staffCount: 0,
        isActive: newBranch.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error creating branch in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, code, address, phone, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Branch ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      status: 'success',
      branch: {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        isMain: updated.code === 'MAIN',
        address: updated.address || '',
        phone: updated.phone || '',
        openingHours: '09:00 - 20:00 น. (ทุกวัน)',
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error updating branch in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
