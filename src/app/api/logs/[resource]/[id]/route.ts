import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string, id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource, id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT Action, UserName, CreatedAt, Details 
       FROM M_AuditLogs 
       WHERE Resource = ? AND ResourceID = ? 
       ORDER BY CreatedAt ASC`,
      [resource, id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching resource audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
