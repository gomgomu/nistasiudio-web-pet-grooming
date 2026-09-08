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
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 }
      );
    }

    const queueItems = await prisma.groomingQueueItem.findMany({
      where: { tenantId: tenant.id },
      include: {
        pet: {
          include: { customer: true },
        },
        groomer: true,
      },
      orderBy: { queueNumber: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      queue: queueItems.map((q) => ({
        id: q.id,
        queueNumber: q.queueNumber,
        status: q.status,
        petName: q.pet.name,
        species: q.pet.species,
        breed: q.pet.breed || '',
        customerName: `${q.pet.customer.firstName} ${q.pet.customer.lastName}`.trim(),
        customerPhone: q.pet.customer.phone,
        groomerName: q.groomer
          ? `${q.groomer.firstName} ${q.groomer.lastName}`.trim()
          : 'ไม่ระบุช่าง',
        specialInstructions: q.specialCareNotes || '',
        estimatedDurationMinutes: q.estimatedDurationMinutes,
        checkInTime: q.startedAt?.toISOString() || q.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching grooming queue from DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { status: 'error', message: 'Queue ID and status required' },
        { status: 400 }
      );
    }

    const updated = await prisma.groomingQueueItem.update({
      where: { id },
      data: { status: status as any },
    });

    return NextResponse.json({
      status: 'success',
      item: updated,
    });
  } catch (error: any) {
    console.error('Error updating grooming queue in DB:', error);
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
      petName,
      customerName,
      customerPhone,
      species = 'DOG',
      breed,
      weight,
      specialCareNotes,
      groomerId,
      estimatedDurationMinutes = 60,
      tenantSlug = 'demo-pet-clinic',
    } = body;

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { tenantId: tenant.id },
    });

    let customer = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: customerPhone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: customerName || 'ลูกค้า Walk-in',
          lastName: '',
          phone: customerPhone || '080-000-0000',
        },
      });
    }

    let pet = await prisma.pet.findFirst({
      where: { tenantId: tenant.id, customerId: customer.id, name: petName },
    });
    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          name: petName || 'สัตว์เลี้ยง',
          species: (species === 'CAT' ? 'CAT' : 'DOG') as any,
          breed: breed || 'พันธุ์ผสม',
          weight: weight ? parseFloat(String(weight)) : 4.0,
        },
      });
    }

    const defaultService = await prisma.service.findFirst({
      where: { tenantId: tenant.id },
    });

    const queueCount = await prisma.groomingQueueItem.count({
      where: { tenantId: tenant.id },
    });

    const queueItem = await prisma.groomingQueueItem.create({
      data: {
        tenantId: tenant.id,
        branchId: branch?.id || '',
        customerId: customer.id,
        petId: pet.id,
        serviceId: defaultService?.id || '',
        groomerId: groomerId || null,
        queueNumber: queueCount + 1,
        status: 'WAITING',
        specialCareNotes,
        estimatedDurationMinutes: Number(estimatedDurationMinutes) || 60,
        priceMinor: BigInt(50000),
      },
      include: {
        pet: {
          include: { customer: true },
        },
      },
    });

    return NextResponse.json({
      status: 'success',
      item: queueItem,
    });
  } catch (error: any) {
    console.error('Error creating grooming queue item in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
