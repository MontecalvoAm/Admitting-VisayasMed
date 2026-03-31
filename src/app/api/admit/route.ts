import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.LastName || !data.GivenName) {
      return NextResponse.json({ error: 'LastName and GivenName are required.' }, { status: 400 });
    }

    const query = `
      INSERT INTO M_Patients (
        LastName, GivenName, MiddleName, Suffix, Age, Birthday, BirthPlace, Sex, ContactNumber, CityAddress, ProvincialAddress, CivilStatus, Religion, Citizenship, Occupation,
        FatherFamilyName, FatherGivenName, FatherMiddleName, FatherContact,
        MotherFamilyName, MotherGivenName, MotherMiddleName, MotherContact,
        SpouseFamilyName, SpouseGivenName, SpouseMiddleName, SpouseContact,
        EmergencyContactName, EmergencyRelation, EmergencyContactNumber,
        ResponsibleName, ResponsibleContact, ResponsibleAddress, ResponsibleRelation,
        AttendingPhysician, PreviouslyAdmitted, PreviousAdmissionDate, PhilHealthStatus, HmoCompany, VmcBenefit, ServiceCaseType,
        PrintedNameSignature, RelationToPatientSignature, NameSignature2,
        CreatedBy, CreatedAt, IsDeleted
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `;

    const values = [
      data.LastName || null, data.GivenName || null, data.MiddleName || null, data.Suffix || null, data.Age || null, data.Birthday || null, data.BirthPlace || null, data.Sex || null, data.ContactNumber || null, data.CityAddress || null, data.ProvincialAddress || null, data.CivilStatus || null, data.Religion || null, data.Citizenship || null, data.Occupation || null,
      data.FatherFamilyName || null, data.FatherGivenName || null, data.FatherMiddleName || null, data.FatherContact || null,
      data.MotherFamilyName || null, data.MotherGivenName || null, data.MotherMiddleName || null, data.MotherContact || null,
      data.SpouseFamilyName || null, data.SpouseGivenName || null, data.SpouseMiddleName || null, data.SpouseContact || null,
      data.EmergencyContactName || null, data.EmergencyRelation || null, data.EmergencyContactNumber || null,
      data.ResponsibleName || null, data.ResponsibleContact || null, data.ResponsibleAddress || null, data.ResponsibleRelation || null,
      data.AttendingPhysician || null, data.PreviouslyAdmitted || false, data.PreviousAdmissionDate || null, data.PhilHealthStatus || null, data.HmoCompany || false, data.VmcBenefit || null, data.ServiceCaseType || null,
      data.PrintedNameSignature || null, data.RelationToPatientSignature || null, data.NameSignature2 || null,
      'System', new Date(), false
    ];

    const [result] = await pool.execute(query, values);

    return NextResponse.json({ success: true, insertId: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error('Error submitting admission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
