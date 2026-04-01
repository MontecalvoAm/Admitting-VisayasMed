import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, (SELECT COUNT(*) FROM M_Users u WHERE u.RoleID = r.RoleID AND u.IsDeleted = false) as UserCount 
       FROM M_Roles r 
       WHERE r.IsDeleted = false 
       ORDER BY r.RoleName
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM M_Roles WHERE IsDeleted = false'
    );

    return NextResponse.json({
      roles: rows,
      total: countRows[0].total
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const session = await getSession();
    const createdBy = session ? `${session.firstName} ${session.lastName}` : 'System';

    if (!data.RoleName) {
      return NextResponse.json({ error: 'Role name is required.' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO M_Roles (RoleName, Description, CreatedBy) VALUES (?, ?, ?)',
      [data.RoleName, data.Description || null, createdBy]
    );

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
