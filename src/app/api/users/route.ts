import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ResultSetHeader } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.Email || !data.Password || !data.FirstName || !data.LastName) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT Email FROM M_Users WHERE Email = ?', [data.Email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.Password, 10);

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
