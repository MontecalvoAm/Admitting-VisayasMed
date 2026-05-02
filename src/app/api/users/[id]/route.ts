import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { getSession } from '@/lib/session';
import { UserSchema } from '@/lib/schemas';
import { hasPermission } from '@/lib/rbac';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // FIX: Check for 'Edit' permission on 'Users' module
    const canEdit = await hasPermission(session.userId, session.roleId, 'Users', 'Edit');
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
    }

    const { id } = await params;
    const rawData = await req.json();

    const parsed = UserSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: parsed.error.format() 
      }, { status: 400 });
    }
    const data = parsed.data;

    const updateData: any = {
      FirstName: data.FirstName,
      LastName: data.LastName,
      Email: data.Email,
      RoleID: data.RoleID || 2,
    };

    if (data.Password && data.Password.length > 0) {
      updateData.Password = await bcrypt.hash(data.Password, 12);
    }

    const updatedUser = await prisma.m_Users.update({
      where: { UserID: Number(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // FIX: Check for 'Delete' permission on 'Users' module
    const canDelete = await hasPermission(session.userId, session.roleId, 'Users', 'Delete');
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
    }

    const { id } = await params;
    
    // Soft delete using Prisma
    await prisma.m_Users.update({
      where: { UserID: Number(id) },
      data: {
        IsDeleted: true,
        DeletedAt: new Date(),
        DeletedBy: `${session.firstName} ${session.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
