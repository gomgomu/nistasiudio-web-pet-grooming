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

    const appointments = await prisma.appointment.findMany({
      where: { tenantId: tenant.id },
      include: {
        customer: true,
        pet: true,
        service: true,
        assignedStaff: true,
        branch: true,
      },
      orderBy: { startAt: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      appointments: appointments.map((a) => ({
        id: a.id,
        customerId: a.customerId,
        petId: a.petId,
        serviceId: a.serviceId,
        staffId: a.staffId || 'u-groomer-01',
        status: a.status,
        startAt: a.startAt.toISOString(),
        endAt: a.endAt.toISOString(),
        startTime: a.startAt.toISOString(),
        endTime: a.endAt.toISOString(),
        customerName: a.customer ? `${a.customer.firstName} ${a.customer.lastName}`.trim() : 'ไม่ระบุลูกค้า',
        customerPhone: a.customer?.phone || '',
        customerLine: a.customer?.lineUserId || undefined,
        petName: a.pet?.name || 'ไม่ระบุสัตว์เลี้ยง',
        petSpecies: (a.pet?.species === 'CAT' ? 'CAT' : 'DOG') as 'DOG' | 'CAT',
        petBreed: a.pet?.breed || 'พันธุ์ผสม',
        petWeight: a.pet?.weight ? Number(a.pet.weight) : 3.5,
        serviceName: a.service?.name || 'บริการทั่วไป',
        serviceCategory: (a.service?.category || 'GROOMING') as any,
        priceMinor: a.service?.basePriceMinor ? Number(a.service.basePriceMinor) : 50000,
        branchName: a.branch?.name || 'สาขาหลัก',
        staffName: a.assignedStaff ? `${a.assignedStaff.firstName} ${a.assignedStaff.lastName}`.trim() : 'ช่างประจำสาขา',
        notes: a.notes || undefined,
        source: 'LINE',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching appointments from DB:', error);
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
      customerId,
      petId,
      customerName,
      customerPhone,
      customerLine,
      petName,
      petSpecies,
      petBreed,
      petWeight,
      branchId,
      serviceId,
      assignedStaffId,
      startTime,
      endTime,
      startAt,
      endAt,
      notes,
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

    let finalCustomerId = customerId;
    let finalPetId = petId;

    // Auto-create customer if walk-in / new
    if ((!finalCustomerId || finalCustomerId.startsWith('c-new-')) && customerName) {
      const newCustomer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: customerName,
          lastName: '',
          phone: customerPhone || '080-000-0000',
          lineUserId: customerLine,
        },
      });
      finalCustomerId = newCustomer.id;
    }

    // Auto-create pet if walk-in / new
    if ((!finalPetId || finalPetId.startsWith('p-new-')) && petName && finalCustomerId) {
      const newPet = await prisma.pet.create({
        data: {
          tenantId: tenant.id,
          customerId: finalCustomerId,
          name: petName,
          species: (petSpecies === 'CAT' ? 'CAT' : 'DOG') as any,
          breed: petBreed || 'พันธุ์ผสม',
          weight: petWeight ? parseFloat(String(petWeight)) : 3.5,
        },
      });
      finalPetId = newPet.id;
    }

    if (!finalCustomerId || !finalPetId) {
      return NextResponse.json(
        { status: 'error', message: 'Customer ID and Pet ID are required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: finalCustomerId, tenantId: tenant.id },
    });

    const pet = await prisma.pet.findFirst({
      where: { id: finalPetId, tenantId: tenant.id },
    });

    if (!customer || !pet) {
      return NextResponse.json(
        { status: 'error', message: 'Customer or Pet not found in this organization' },
        { status: 404 }
      );
    }

    const mainBranch = await prisma.branch.findFirst({
      where: { tenantId: tenant.id },
    });

    const defaultService = serviceId
      ? await prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id } })
      : await prisma.service.findFirst({ where: { tenantId: tenant.id } });

    const rawStart = startTime || startAt;
    const rawEnd = endTime || endAt;
    const start = rawStart ? new Date(rawStart) : new Date();
    const end = rawEnd ? new Date(rawEnd) : new Date(start.getTime() + 60 * 60 * 1000);

    const newAppt = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        branchId: branchId || mainBranch?.id || '',
        customerId: customer.id,
        petId: pet.id,
        serviceId: defaultService?.id || '',
        staffId: assignedStaffId || null,
        startAt: start,
        endAt: end,
        status: 'CONFIRMED',
        notes,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      appointment: newAppt,
    });
  } catch (error: any) {
    console.error('Error creating appointment in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
