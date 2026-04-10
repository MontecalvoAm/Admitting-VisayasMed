import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
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
      return NextResponse.json({ error: 'Validation Error', details: parsed.error.format() }, { status: 400 });
    }
    const data = parsed.data;

    const query = `
      UPDATE M_Users SET 
        FirstName = ?, LastName = ?, Email = ?, RoleID = ?, 
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE UserID = ?
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      data.FirstName,
      data.LastName,
      data.Email,
      data.RoleID || 2,
      id
    ]);

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
      'UPDATE M_Users SET IsDeleted = true WHERE UserID = ?',
      [id]
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
