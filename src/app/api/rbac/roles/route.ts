import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    const roles = await prisma.m_Roles.findMany({
      where: { IsDeleted: false },
      include: {
        _count: {
          select: { Users: { where: { IsDeleted: false } } }
        }
      },
      orderBy: { RoleName: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.m_Roles.count({
      where: { IsDeleted: false }
    });

    return NextResponse.json({
      roles: roles.map(r => ({
        ...r,
        UserCount: r._count.Users
      })),
      total
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // FIX: Check for 'Add' permission on 'Roles' module
    const canAdd = await hasPermission(session.userId, session.roleId, 'Roles', 'Add');
    if (!canAdd) {
      return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
    }

    const data = await req.json();
    const createdBy = `${session.firstName} ${session.lastName}`;

    if (!data.RoleName) {
      return NextResponse.json({ error: 'Role name is required.' }, { status: 400 });
    }

    const newRole = await prisma.m_Roles.create({
      data: {
        RoleName: data.RoleName,
        Description: data.Description || null,
        CreatedBy: createdBy,
      }
    });

    return NextResponse.json({ success: true, id: newRole.RoleID }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
