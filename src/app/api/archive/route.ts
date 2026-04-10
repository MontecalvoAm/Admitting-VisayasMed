import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission for Archive module
  const canView = await hasPermission(session.userId, session.roleId, 'Archive', 'View');
  if (!canView) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'users' or 'patients'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    if (type === 'users') {
      const [countRows] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM M_Users WHERE IsDeleted = true'
      );
      const totalItems = countRows[0].count;

      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT UserID, FirstName, LastName, Email, RoleID, DeletedAt, DeletedBy FROM M_Users WHERE IsDeleted = true ORDER BY DeletedAt DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return NextResponse.json({
        data: rows,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      });
    } 
    
    if (type === 'patients') {
      const [countRows] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM M_Patients WHERE IsDeleted = true'
      );
      const totalItems = countRows[0].count;

      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT PatientID as Id, LastName, GivenName, MiddleName, Birthday, DeletedAt, DeletedBy FROM M_Patients WHERE IsDeleted = true ORDER BY DeletedAt DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      return NextResponse.json({
        data: rows,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
