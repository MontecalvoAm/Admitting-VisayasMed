import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json({ error: 'Invalid Admission ID' }, { status: 400 });
    }

    // Update the IsViewed status
    await pool.query(
      'UPDATE M_Admissions SET IsViewed = 1 WHERE AdmissionID = ?',
      [admissionId]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error marking admission as viewed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
