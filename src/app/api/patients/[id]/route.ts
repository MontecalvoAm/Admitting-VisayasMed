import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { recordAuditLog } from '@/lib/auditLogger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM M_Patients WHERE Id = ? AND IsDeleted = false',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    // Basic validation
    if (!data.LastName || !data.GivenName) {
      return NextResponse.json({ error: 'LastName and GivenName are required.' }, { status: 400 });
    }

    const query = `
      UPDATE M_Patients SET 
        LastName = ?, GivenName = ?, MiddleName = ?, Suffix = ?, Age = ?, Birthday = ?, BirthPlace = ?, Sex = ?, 
        ContactNumber = ?, CityAddress = ?, ProvincialAddress = ?, CivilStatus = ?, Religion = ?, Citizenship = ?, Occupation = ?,
        FatherFamilyName = ?, FatherGivenName = ?, FatherMiddleName = ?, FatherContact = ?,
        MotherFamilyName = ?, MotherGivenName = ?, MotherMiddleName = ?, MotherContact = ?,
        SpouseFamilyName = ?, SpouseGivenName = ?, SpouseMiddleName = ?, SpouseContact = ?,
        EmergencyContactName = ?, EmergencyRelation = ?, EmergencyContactNumber = ?,
        ResponsibleName = ?, ResponsibleContact = ?, ResponsibleAddress = ?, ResponsibleRelation = ?,
        AttendingPhysician = ?, PreviouslyAdmitted = ?, PreviousAdmissionDate = ?, PhilHealthStatus = ?, 
        HmoCompany = ?, VmcBenefit = ?, ServiceCaseType = ?,
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `;

    const values = [
      data.LastName || null, data.GivenName || null, data.MiddleName || null, data.Suffix || null, data.Age || null, data.Birthday || null, data.BirthPlace || null, data.Sex || null, 
      data.ContactNumber || null, data.CityAddress || null, data.ProvincialAddress || null, data.CivilStatus || null, data.Religion || null, data.Citizenship || null, data.Occupation || null,
      data.FatherFamilyName || null, data.FatherGivenName || null, data.FatherMiddleName || null, data.FatherContact || null,
      data.MotherFamilyName || null, data.MotherGivenName || null, data.MotherMiddleName || null, data.MotherContact || null,
      data.SpouseFamilyName || null, data.SpouseGivenName || null, data.SpouseMiddleName || null, data.SpouseContact || null,
      data.EmergencyContactName || null, data.EmergencyRelation || null, data.EmergencyContactNumber || null,
      data.ResponsibleName || null, data.ResponsibleContact || null, data.ResponsibleAddress || null, data.ResponsibleRelation || null,
      data.AttendingPhysician || null, data.PreviouslyAdmitted || false, data.PreviousAdmissionDate || null, data.PhilHealthStatus || null, 
      data.HmoCompany || false, data.VmcBenefit || null, data.ServiceCaseType || null,
      id
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Record Audit Log
    await recordAuditLog({
      action: 'UPDATE',
      resource: 'Patient',
      resourceId: id,
      details: `Patient record updated for ${data.LastName}, ${data.GivenName}.`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get patient name for the log before deleting (soft)
    const [patientRows] = await pool.query<RowDataPacket[]>(
      'SELECT LastName, GivenName FROM M_Patients WHERE Id = ?',
      [id]
    );
    const patientName = patientRows.length > 0 ? `${patientRows[0].LastName}, ${patientRows[0].GivenName}` : 'Unknown';

    // Soft delete
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE M_Patients SET IsDeleted = true, DeletedAt = CURRENT_TIMESTAMP WHERE Id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Record Audit Log
    await recordAuditLog({
      action: 'DELETE',
      resource: 'Patient',
      resourceId: id,
      details: `Patient record deleted (soft) for ${patientName}.`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
