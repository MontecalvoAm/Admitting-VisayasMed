import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const { RoleName, Description } = await req.json();
    const session = await getSession();
    const updatedBy = session ? `${session.firstName} ${session.lastName}` : 'System';

    if (!RoleName) {
      return NextResponse.json({ error: 'Role name is required.' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE M_Roles 
       SET RoleName = ?, Description = ?, UpdatedBy = ?, UpdatedAt = CURRENT_TIMESTAMP 
       WHERE RoleID = ?`,
      [RoleName, Description || null, updatedBy, roleId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const session = await getSession();
    const deletedBy = session ? `${session.firstName} ${session.lastName}` : 'System';

    // Check if role has active users
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM M_Users WHERE RoleID = ? AND IsDeleted = false',
      [roleId]
    );

    if (users[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that has active users.' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE M_Roles SET IsDeleted = true, DeletedBy = ?, DeletedAt = CURRENT_TIMESTAMP WHERE RoleID = ?',
      [deletedBy, roleId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
