import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';
import { getSession } from '@/lib/session';
import { UserSchema } from '@/lib/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const rawData = await req.json();

    const parsed = UserSchema.safeParse(rawData);
    if (!parsed.success) {
      console.error('User update validation failed:', parsed.error.format());
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: parsed.error.format() 
      }, { status: 400 });
    }
    const data = parsed.data;

    let query = `
      UPDATE M_Users SET 
        FirstName = ?, LastName = ?, Email = ?, RoleID = ?, 
        UpdatedAt = CURRENT_TIMESTAMP
    `;
    const queryParams: (string | number)[] = [
      data.FirstName,
      data.LastName,
      data.Email,
      data.RoleID || 2
    ];

    if (data.Password && data.Password.length > 0) {
      query += `, Password = ?`;
      const hashedPassword = await bcrypt.hash(data.Password, 12);
      queryParams.push(hashedPassword);
    }

    query += ` WHERE UserID = ?`;
    queryParams.push(id);

    const [result] = await pool.execute<ResultSetHeader>(query, queryParams);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    // Soft delete
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE M_Users SET IsDeleted = true, DeletedAt = CURRENT_TIMESTAMP, DeletedBy = ? WHERE UserID = ?',
      [`${session.firstName} ${session.lastName}`, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
