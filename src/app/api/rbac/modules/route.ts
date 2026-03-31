import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM M_Modules WHERE IsDeleted = false ORDER BY SortOrder'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
