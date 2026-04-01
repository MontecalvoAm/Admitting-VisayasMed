import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { recordAuditLog } from '@/lib/auditLogger';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const query = `
      UPDATE M_Admissions SET 
        Age = ?, AttendingPhysician = ?, PreviouslyAdmitted = ?, PreviousAdmissionDate = ?, PhilHealthStatus = ?, 
        HmoCompany = ?, VmcBenefit = ?, ServiceCaseType = ?,
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE AdmissionID = ?
    `;

    const values = [
      data.Age || null, data.AttendingPhysician || null, data.PreviouslyAdmitted || false, 
      data.PreviousAdmissionDate || null, data.PhilHealthStatus || null, 
      data.HmoCompany || false, data.VmcBenefit || null, data.ServiceCaseType || null,
      id
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    // Record Audit Log
    await recordAuditLog({
      action: 'UPDATE',
      resource: 'Admission',
      resourceId: id,
      details: `Historical admission record (ID: ${id}) updated.`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating admission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete only this specific admission
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE M_Admissions SET IsDeleted = true, DeletedBy = "System/User", DeletedAt = CURRENT_TIMESTAMP WHERE AdmissionID = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    // Record Audit Log
    await recordAuditLog({
      action: 'DELETE',
      resource: 'Admission',
      resourceId: id,
      details: `Specific admission record (ID: ${id}) deleted (soft).`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
