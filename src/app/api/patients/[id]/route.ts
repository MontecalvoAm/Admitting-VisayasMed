import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { recordAuditLog } from '@/lib/auditLogger';
import { getSession } from '@/lib/session';
import { AdmitSchema } from '@/lib/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    // Join with latest admission to get full historical context
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, a.* 
       FROM M_Patients p
       LEFT JOIN M_Admissions a ON p.PatientID = a.PatientID 
       WHERE p.PatientID = ? AND p.IsDeleted = false
       ORDER BY a.AdmittedAt DESC LIMIT 1`,
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
  const connection = await pool.getConnection();
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const rawData = await req.json();

    const parsed = AdmitSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation Error', details: parsed.error.format() }, { status: 400 });
    }
    const data = parsed.data;

    await connection.beginTransaction();

    // 1. Update Patient Demographics
    const patientQuery = `
      UPDATE M_Patients SET 
        LastName = ?, GivenName = ?, MiddleName = ?, Suffix = ?, Birthday = ?, BirthPlace = ?, Sex = ?, 
        ContactNumber = ?, CityAddress = ?, ProvincialAddress = ?, CivilStatus = ?, Religion = ?, Citizenship = ?, Occupation = ?,
        FatherFamilyName = ?, FatherGivenName = ?, FatherMiddleName = ?, FatherContact = ?,
        MotherFamilyName = ?, MotherGivenName = ?, MotherMiddleName = ?, MotherContact = ?,
        SpouseFamilyName = ?, SpouseGivenName = ?, SpouseMiddleName = ?, SpouseContact = ?,
        EmergencyContactName = ?, EmergencyRelation = ?, EmergencyContactNumber = ?,
        ResponsibleName = ?, ResponsibleContact = ?, ResponsibleAddress = ?, ResponsibleRelation = ?,
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE PatientID = ?
    `;

    const patientValues = [
      data.LastName || null, data.GivenName || null, data.MiddleName || null, data.Suffix || null, data.Birthday || null, data.BirthPlace || null, data.Sex || null, 
      data.ContactNumber || null, data.CityAddress || null, data.ProvincialAddress || null, data.CivilStatus || null, data.Religion || null, data.Citizenship || null, data.Occupation || null,
      data.FatherFamilyName || null, data.FatherGivenName || null, data.FatherMiddleName || null, data.FatherContact || null,
      data.MotherFamilyName || null, data.MotherGivenName || null, data.MotherMiddleName || null, data.MotherContact || null,
      data.SpouseFamilyName || null, data.SpouseGivenName || null, data.SpouseMiddleName || null, data.SpouseContact || null,
      data.EmergencyContactName || null, data.EmergencyRelation || null, data.EmergencyContactNumber || null,
      data.ResponsibleName || null, data.ResponsibleContact || null, data.ResponsibleAddress || null, data.ResponsibleRelation || null,
      id
    ];

    await connection.execute(patientQuery, patientValues);

    // 2. Update Latest Admission (if it exists)
    // In a truly scalable system, you might want to version this or only update the specific admission ID
    // For now, we update the most recent one to maintain compatible behavior with the legacy single-row model
    const admissionQuery = `
      UPDATE M_Admissions SET 
        Age = ?, AttendingPhysician = ?, PreviouslyAdmitted = ?, PreviousAdmissionDate = ?, PhilHealthStatus = ?, 
        HmoCompany = ?, VmcBenefit = ?, ServiceCaseType = ?,
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE PatientID = ?
      ORDER BY AdmittedAt DESC LIMIT 1
    `;

    await connection.execute(admissionQuery, [
      data.Age || null, data.AttendingPhysician || null, data.PreviouslyAdmitted || false, 
      data.PreviousAdmissionDate || null, data.PhilHealthStatus || null, 
      data.HmoCompany || false, data.VmcBenefit || null, data.ServiceCaseType || null,
      id
    ]);

    await connection.commit();

    await recordAuditLog({
      action: 'UPDATE',
      resource: 'Patient',
      resourceId: id,
      details: `Normalized patient and admission record updated for ${data.LastName}, ${data.GivenName}.`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    connection.release();
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
    
    // Get patient name for the log before deleting (soft)
    const [patientRows] = await pool.query<RowDataPacket[]>(
      'SELECT LastName, GivenName FROM M_Patients WHERE PatientID = ?',
      [id]
    );
    const patientName = patientRows.length > 0 ? `${patientRows[0].LastName}, ${patientRows[0].GivenName}` : 'Unknown';

    // Soft delete patient
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE M_Patients SET IsDeleted = true WHERE PatientID = ?',
      [id]
    );

    // Soft delete admissions
    await pool.execute(
      'UPDATE M_Admissions SET IsDeleted = true WHERE PatientID = ?',
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
