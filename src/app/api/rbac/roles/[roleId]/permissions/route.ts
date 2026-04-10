import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT ModuleID, CanView, CanAdd, CanEdit, CanDelete FROM M_RolePermissions WHERE RoleID = ? AND IsDeleted = false',
      [roleId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const data = await req.json(); // Array of { ModuleID, CanView, CanAdd, CanEdit, CanDelete }
    const session = await getSession();
    const updatedBy = session ? `${session.firstName} ${session.lastName}` : 'System';

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const perm of data) {
        const [existing] = await connection.query<RowDataPacket[]>(
          'SELECT RolePermissionID FROM M_RolePermissions WHERE RoleID = ? AND ModuleID = ?',
          [roleId, perm.ModuleID]
        );

        if (existing.length > 0) {
          await connection.query(
            `UPDATE M_RolePermissions 
             SET CanView = ?, CanAdd = ?, CanEdit = ?, CanDelete = ?, UpdatedBy = ?, UpdatedAt = CURRENT_TIMESTAMP, IsDeleted = false
             WHERE RolePermissionID = ?`,
            [perm.CanView ? 1 : 0, perm.CanAdd ? 1 : 0, perm.CanEdit ? 1 : 0, perm.CanDelete ? 1 : 0, updatedBy, existing[0].RolePermissionID]
          );
        } else {
          await connection.query(
            `INSERT INTO M_RolePermissions (RoleID, ModuleID, CanView, CanAdd, CanEdit, CanDelete, CreatedBy)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [roleId, perm.ModuleID, perm.CanView ? 1 : 0, perm.CanAdd ? 1 : 0, perm.CanEdit ? 1 : 0, perm.CanDelete ? 1 : 0, updatedBy]
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
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
