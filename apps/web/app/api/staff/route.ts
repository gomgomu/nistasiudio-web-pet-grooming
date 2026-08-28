import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const roleTitles: Record<string, string> = {
  TENANT_OWNER: 'เจ้าของร้าน (Owner)',
  VETERINARIAN: 'สัตวแพทย์ (Doctor OPD)',
  GROOMER: 'ช่างกรูมมิ่ง (Groomer)',
  RECEPTIONIST: 'พนักงานต้อนรับ & แคชเชียร์',
  SUPER_ADMIN: 'Super Admin (HQ)',
  STAFF: 'พนักงานทั่วไป',
};

const gradients: Record<string, string> = {
  VETERINARIAN: 'from-purple-600 to-pink-700',
  GROOMER: 'from-teal-600 to-emerald-700',
  RECEPTIONIST: 'from-amber-600 to-orange-700',
  TENANT_OWNER: 'from-blue-600 to-indigo-700',
  SUPER_ADMIN: 'from-violet-600 to-purple-800',
  STAFF: 'from-slate-600 to-slate-800',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'demo-pet-clinic';

    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
    });

    const users = await prisma.user.findMany({
      where: tenant ? { tenantId: tenant.id } : {},
      include: {
        userBranches: {
          include: { branch: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      staff: users.map((u) => {
        const branchName =
          u.userBranches.length > 0
            ? u.userBranches[0].branch.name
            : 'สาขาทองหล่อ (Main)';
        const fullName = `${u.firstName} ${u.lastName}`.trim();
        return {
          id: u.id,
          name: fullName || u.email.split('@')[0],
          email: u.email,
          phone: u.phone || '08X-XXX-XXXX',
          role: u.role,
          roleTitle: roleTitles[u.role] || u.role,
          branchName,
          avatarText: (fullName || u.email).charAt(0).toUpperCase(),
          avatarGradient: gradients[u.role] || 'from-blue-500 to-indigo-600',
          isActive: u.status === 'ACTIVE',
          joinedAt: u.createdAt.toISOString().split('T')[0],
        };
      }),
    });
  } catch (error: any) {
    console.error('Error fetching staff from DB:', error);
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
      email,
      phone,
      role = 'GROOMER',
      branchId,
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

    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || 'PetFlow';

    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: email.trim().toLowerCase(),
        passwordHash:
          '$argon2id$v=19$m=65536,t=3,p=4$4iU6g2d1gR7M5Vn$X5v7n9mK8j3H2g1f0e9d8c7b6a5', // default hashed password123
        firstName,
        lastName,
        phone,
        role: role as any,
        status: 'ACTIVE',
      },
    });

    // Link user to primary branch if exists
    const primaryBranch = await prisma.branch.findFirst({
      where: { tenantId: tenant.id },
    });

    if (primaryBranch) {
      await prisma.userBranch.create({
        data: {
          userId: newUser.id,
          branchId: branchId || primaryBranch.id,
        },
      });
    }

    return NextResponse.json({
      status: 'success',
      staff: {
        id: newUser.id,
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        roleTitle: roleTitles[newUser.role] || newUser.role,
        branchName: primaryBranch?.name || 'สาขาทองหล่อ (Main)',
        avatarText: firstName.charAt(0).toUpperCase(),
        avatarGradient: gradients[newUser.role] || 'from-blue-500 to-indigo-600',
        isActive: true,
        joinedAt: newUser.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    console.error('Error creating staff in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'User ID is required' },
        { status: 400 }
      );
    }

    let firstName: string | undefined;
    let lastName: string | undefined;
    if (name) {
      const parts = name.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || ' ';
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone }),
        ...(role && { role: role as any }),
        ...(isActive !== undefined && {
          status: isActive ? 'ACTIVE' : 'SUSPENDED',
        }),
      },
    });

    return NextResponse.json({
      status: 'success',
      user: updated,
    });
  } catch (error: any) {
    console.error('Error updating staff in DB:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
