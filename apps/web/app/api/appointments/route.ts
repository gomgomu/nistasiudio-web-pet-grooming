import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'demo-pet-clinic';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    const appointments = await prisma.appointment.findMany({
      where: tenant ? { tenantId: tenant.id } : {},
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
        status: a.status,
        startTime: a.startAt.toISOString(),
        endTime: a.endAt.toISOString(),
        customerName: a.customer ? `${a.customer.firstName} ${a.customer.lastName}`.trim() : '',
        customerPhone: a.customer?.phone || '',
        petName: a.pet?.name || '',
        petSpecies: a.pet?.species || 'DOG',
        serviceName: a.service?.name || 'บริการทั่วไป',
        branchName: a.branch?.name || 'สาขาหลัก',
        staffName: a.assignedStaff ? `${a.assignedStaff.firstName} ${a.assignedStaff.lastName}`.trim() : 'ไม่ระบุ',
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
      branchId,
      serviceId,
      assignedStaffId,
      startTime,
      endTime,
      notes,
      tenantSlug = 'demo-pet-clinic',
    } = body;

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

    const mainBranch = await prisma.branch.findFirst({
      where: { tenantId: tenant.id },
    });

    const firstCustomer = await prisma.customer.findFirst({
      where: { tenantId: tenant.id },
    });

    const firstPet = await prisma.pet.findFirst({
      where: { tenantId: tenant.id },
    });

    const firstService = await prisma.service.findFirst({
      where: { tenantId: tenant.id },
    });

    const firstUser = await prisma.user.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!firstCustomer || !firstPet || !mainBranch) {
      return NextResponse.json(
        { status: 'error', message: 'Required entities missing' },
        { status: 400 }
      );
    }

    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : new Date(Date.now() + 60 * 60 * 1000);

    const newAppt = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        branchId: branchId || mainBranch.id,
        customerId: customerId || firstCustomer.id,
        petId: petId || firstPet.id,
        serviceId: serviceId || firstService?.id || '',
        staffId: assignedStaffId || firstUser?.id,
        createdById: firstUser?.id,
        startAt: start,
        endAt: end,
        status: 'CONFIRMED',
        notes,
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
