import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { UserSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawData = await req.json();
    const parsed = UserSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation Error', details: parsed.error.format() }, { status: 400 });
    }
    const data = parsed.data;
    
    if (!data.Password) {
      return NextResponse.json({ error: 'Password is required for new users.' }, { status: 400 });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT Email FROM M_Users WHERE Email = ?', [data.Email]);
    if ((existing as RowDataPacket[]).length > 0) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.Password, 12);

    const query = `
      INSERT INTO M_Users (FirstName, LastName, Email, Password, RoleID, CreatedAt, IsDeleted)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, false)
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      data.FirstName,
      data.LastName,
      data.Email,
      hashedPassword,
      data.RoleID || 2, // Default to Staff
    ]);

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
