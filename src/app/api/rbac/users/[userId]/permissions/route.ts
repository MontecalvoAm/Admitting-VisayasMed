import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSession } from '@/lib/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT ModuleID, CanView, CanAdd, CanEdit, CanDelete FROM M_UserPermissions WHERE UserID = ? AND IsDeleted = false',
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const data = await req.json(); // Array of { ModuleID, CanView, CanAdd, CanEdit, CanDelete }
    const session = await getSession();
    const updatedBy = session ? `${session.firstName} ${session.lastName}` : 'System';

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First, soft-delete existing overrides for this user?
      // Actually, it's better to update existing and insert new ones.
      
      for (const perm of data) {
        const [existing] = await connection.query<RowDataPacket[]>(
          'SELECT UserPermissionID FROM M_UserPermissions WHERE UserID = ? AND ModuleID = ?',
          [userId, perm.ModuleID]
        );

        if (existing.length > 0) {
          await connection.query(
            `UPDATE M_UserPermissions 
             SET CanView = ?, CanAdd = ?, CanEdit = ?, CanDelete = ?, UpdatedBy = ?, UpdatedAt = CURRENT_TIMESTAMP, IsDeleted = false
             WHERE UserPermissionID = ?`,
            [perm.CanView ? 1 : 0, perm.CanAdd ? 1 : 0, perm.CanEdit ? 1 : 0, perm.CanDelete ? 1 : 0, updatedBy, existing[0].UserPermissionID]
          );
        } else {
          await connection.query(
            `INSERT INTO M_UserPermissions (UserID, ModuleID, CanView, CanAdd, CanEdit, CanDelete, CreatedBy)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, perm.ModuleID, perm.CanView ? 1 : 0, perm.CanAdd ? 1 : 0, perm.CanEdit ? 1 : 0, perm.CanDelete ? 1 : 0, updatedBy]
          );
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating user permission overrides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
