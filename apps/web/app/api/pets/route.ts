import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'demo-pet-clinic';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    const pets = await prisma.pet.findMany({
      where: tenant ? { tenantId: tenant.id } : {},
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      status: 'success',
      pets: pets.map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        gender: p.sex,
        weightKg: p.weight ? p.weight.toString() : null,
        customerId: p.customerId,
        ownerName: p.customer ? `${p.customer.firstName} ${p.customer.lastName}`.trim() : 'ไม่ระบุเจ้าของ',
        ownerPhone: p.customer?.phone || '',
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching pets from DB:', error);
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
      species = 'DOG',
      breed,
      gender = 'UNKNOWN',
      weightKg,
      customerId,
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

    let targetCustomerId = customerId;
    if (!targetCustomerId) {
      const firstCustomer = await prisma.customer.findFirst({
        where: { tenantId: tenant.id },
      });
      targetCustomerId = firstCustomer?.id;
    }

    if (!targetCustomerId) {
      return NextResponse.json(
        { status: 'error', message: 'Customer not found' },
        { status: 400 }
      );
    }

    const newPet = await prisma.pet.create({
      data: {
        tenantId: tenant.id,
        customerId: targetCustomerId,
        name,
        species: species as any,
        breed,
        sex: (gender === 'MALE' ? 'MALE' : gender === 'FEMALE' ? 'FEMALE' : 'UNKNOWN') as any,
        weight: weightKg ? parseFloat(weightKg) : null,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      pet: {
        id: newPet.id,
        name: newPet.name,
        species: newPet.species,
        breed: newPet.breed,
        gender: newPet.sex,
        weightKg: newPet.weight ? newPet.weight.toString() : null,
        customerId: newPet.customerId,
        ownerName: newPet.customer
          ? `${newPet.customer.firstName} ${newPet.customer.lastName}`.trim()
          : '',
        ownerPhone: newPet.customer?.phone || '',
      },
    });
  } catch (error: any) {
    console.error('Error creating pet in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
