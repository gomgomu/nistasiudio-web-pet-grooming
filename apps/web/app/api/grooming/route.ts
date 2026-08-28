import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'demo-pet-clinic';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    const queueItems = await prisma.groomingQueueItem.findMany({
      where: tenant ? { tenantId: tenant.id } : {},
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
