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

    const existing = await prisma.groomingQueueItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { status: 'error', message: 'Grooming queue item not found' },
        { status: 404 }
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
      customerId: inputCustomerId,
      petId: inputPetId,
      petName,
      customerName,
      customerPhone,
      species = 'DOG',
      breed,
      weight,
      specialCareNotes,
      serviceId: inputServiceId,
      serviceName,
      groomerId: inputGroomerId,
      groomerName,
      appointmentId,
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

    let customerId = inputCustomerId;
    if (!customerId) {
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
      customerId = customer.id;
    }

    let petId = inputPetId;
    if (!petId) {
      let pet = await prisma.pet.findFirst({
        where: { tenantId: tenant.id, customerId, name: petName },
      });
      if (!pet) {
        pet = await prisma.pet.create({
          data: {
            tenantId: tenant.id,
            customerId,
            name: petName || 'สัตว์เลี้ยง',
            species: (species === 'CAT' ? 'CAT' : 'DOG') as any,
            breed: breed || 'พันธุ์ผสม',
            weight: weight ? parseFloat(String(weight)) : 4.0,
          },
        });
      }
      petId = pet.id;
    }

    // Resolve service and price
    let targetService = null;
    if (inputServiceId) {
      targetService = await prisma.service.findFirst({
        where: { id: inputServiceId, tenantId: tenant.id },
      });
    }
    if (!targetService && serviceName) {
      targetService = await prisma.service.findFirst({
        where: { tenantId: tenant.id, name: { contains: serviceName } },
      });
    }
    if (!targetService) {
      targetService = await prisma.service.findFirst({
        where: { tenantId: tenant.id },
      });
    }

    // Resolve groomer
    let finalGroomerId = inputGroomerId || null;
    if (!finalGroomerId && groomerName && groomerName !== 'ไม่ระบุช่าง') {
      const matchedUser = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            { firstName: { contains: groomerName } },
            { lastName: { contains: groomerName } },
          ],
        },
      });
      if (matchedUser) {
        finalGroomerId = matchedUser.id;
      }
    }

    const queueCount = await prisma.groomingQueueItem.count({
      where: { tenantId: tenant.id },
    });

    const calculatedPrice = targetService?.basePriceMinor ? targetService.basePriceMinor : BigInt(50000);

    const queueItem = await prisma.groomingQueueItem.create({
      data: {
        tenantId: tenant.id,
        branchId: branch?.id || '',
        appointmentId: appointmentId || null,
        customerId,
        petId,
        serviceId: targetService?.id || '',
        groomerId: finalGroomerId,
        queueNumber: queueCount + 1,
        status: 'WAITING',
        specialCareNotes,
        estimatedDurationMinutes: Number(estimatedDurationMinutes) || 60,
        priceMinor: calculatedPrice,
      },
      include: {
        pet: {
          include: { customer: true },
        },
      },
    });

    const serializedItem = JSON.parse(
      JSON.stringify(queueItem, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value
      )
    );

    return NextResponse.json({
      status: 'success',
      item: serializedItem,
    });
  } catch (error: any) {
    console.error('Error creating grooming queue item in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
