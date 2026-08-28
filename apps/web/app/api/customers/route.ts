import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'demo-pet-clinic';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    const customers = await prisma.customer.findMany({
      where: tenant ? { tenantId: tenant.id } : {},
      include: {
        pets: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      status: 'success',
      customers: customers.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        lineUserId: c.lineUserId,
        address: c.address,
        marketingStatus: c.marketingStatus,
        createdAt: c.createdAt.toISOString(),
        pets: c.pets.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
        })),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching customers from DB:', error);
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
      firstName,
      lastName = '',
      phone,
      email,
      address,
      lineUserId,
      marketingStatus = 'OPTED_IN',
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

    const newCustomer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName,
        lastName,
        phone,
        email,
        address,
        lineUserId,
        marketingStatus: marketingStatus as any,
      },
    });

    return NextResponse.json({
      status: 'success',
      customer: {
        id: newCustomer.id,
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        phone: newCustomer.phone,
        email: newCustomer.email,
        lineUserId: newCustomer.lineUserId,
        address: newCustomer.address,
        marketingStatus: newCustomer.marketingStatus,
        createdAt: newCustomer.createdAt.toISOString(),
        pets: [],
      },
    });
  } catch (error: any) {
    console.error('Error creating customer in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
