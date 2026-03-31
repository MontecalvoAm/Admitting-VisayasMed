import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { recordAuditLog } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.LastName || !data.GivenName) {
      return NextResponse.json({ error: 'LastName and GivenName are required.' }, { status: 400 });
    }

    const query = `
      INSERT INTO M_Patients (
        LastName, GivenName, MiddleName, Suffix, Age, Birthday, BirthPlace, Sex, 
        ContactNumber, CityAddress, ProvincialAddress, CivilStatus, Religion, Citizenship, Occupation,
        FatherFamilyName, FatherGivenName, FatherMiddleName, FatherContact,
        MotherFamilyName, MotherGivenName, MotherMiddleName, MotherContact,
        SpouseFamilyName, SpouseGivenName, SpouseMiddleName, SpouseContact,
        EmergencyContactName, EmergencyRelation, EmergencyContactNumber,
        ResponsibleName, ResponsibleContact, ResponsibleAddress, ResponsibleRelation,
        AttendingPhysician, PreviouslyAdmitted, PreviousAdmissionDate, PhilHealthStatus, 
        HmoCompany, VmcBenefit, ServiceCaseType,
        CreatedAt, IsDeleted
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, 
        ?, ?, ?,
        CURRENT_TIMESTAMP, false
      )
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
      data.HmoCompany || false, data.VmcBenefit || null, data.ServiceCaseType || null
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    // Record Audit Log
    await recordAuditLog({
      action: 'CREATE',
      resource: 'Patient',
      resourceId: result.insertId,
      details: `New patient record created for ${data.LastName}, ${data.GivenName}.`
    });

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient admission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
