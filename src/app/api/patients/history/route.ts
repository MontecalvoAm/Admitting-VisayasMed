import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lastName = searchParams.get('lastName');
    const givenName = searchParams.get('givenName');
    const middleName = searchParams.get('middleName') || '';
    const suffix = searchParams.get('suffix') || '';

    if (!lastName || !givenName) {
      return NextResponse.json({ error: 'LastName and GivenName are required.' }, { status: 400 });
    }

    const query = `
      SELECT * FROM M_Patients 
      WHERE TRIM(LastName) = TRIM(?) 
        AND TRIM(GivenName) = TRIM(?) 
        AND (TRIM(MiddleName) = TRIM(?) OR (MiddleName IS NULL AND ? = ''))
        AND (TRIM(Suffix) = TRIM(?) OR (Suffix IS NULL AND ? = ''))
      AND IsDeleted = false
      ORDER BY CreatedAt DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [lastName, givenName, middleName, middleName, suffix, suffix]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
