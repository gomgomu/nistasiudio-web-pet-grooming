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

    const pets = await prisma.pet.findMany({
      where: { tenantId: tenant.id },
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
      birthDate,
      allergies,
      behavioralNotes,
      specialRequirements,
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

    if (!customerId) {
      return NextResponse.json(
        { status: 'error', message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const targetCustomer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: tenant.id },
    });

    if (!targetCustomer) {
      return NextResponse.json(
        { status: 'error', message: 'Customer not found in this organization' },
        { status: 404 }
      );
    }

    const newPet = await prisma.pet.create({
      data: {
        tenantId: tenant.id,
        customerId: targetCustomer.id,
        name,
        species: species as any,
        breed,
        sex: (gender === 'MALE' ? 'MALE' : gender === 'FEMALE' ? 'FEMALE' : 'UNKNOWN') as any,
        weight: weightKg ? parseFloat(weightKg) : null,
        birthDate: birthDate ? new Date(birthDate) : null,
        allergies: allergies || null,
        behavioralNotes: behavioralNotes || null,
        specialRequirements: specialRequirements || null,
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
