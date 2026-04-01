import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lastName = searchParams.get('lastName');
    const givenName = searchParams.get('givenName');
    
    if (!lastName || !givenName) {
      return NextResponse.json({ error: 'LastName and GivenName are required.' }, { status: 400 });
    }

    // 1. Find the Patient ID
    const [patients] = await pool.query<RowDataPacket[]>(
      `SELECT PatientID FROM M_Patients 
       WHERE TRIM(LOWER(LastName)) = TRIM(LOWER(?)) 
         AND TRIM(LOWER(GivenName)) = TRIM(LOWER(?)) 
         AND IsDeleted = false`,
      [lastName, givenName]
    );

    if (patients.length === 0) {
      return NextResponse.json([]);
    }

    const patientIds = patients.map(p => p.PatientID);

    // 2. Fetch all admissions for these patient IDs with demographic data
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, a.AdmissionID as Id, p.LastName, p.GivenName, p.MiddleName, p.Suffix, 
              p.Birthday, p.BirthPlace, p.Sex, p.ContactNumber, p.CityAddress, 
              p.ProvincialAddress, p.CivilStatus, p.Religion, p.Citizenship, p.Occupation,
              p.FatherFamilyName, p.FatherGivenName, p.FatherMiddleName, p.FatherContact,
              p.MotherFamilyName, p.MotherGivenName, p.MotherMiddleName, p.MotherContact,
              p.SpouseFamilyName, p.SpouseGivenName, p.SpouseMiddleName, p.SpouseContact,
              p.EmergencyContactName, p.EmergencyRelation, p.EmergencyContactNumber,
              p.ResponsibleName, p.ResponsibleContact, p.ResponsibleAddress, p.ResponsibleRelation
       FROM M_Admissions a
       JOIN M_Patients p ON a.PatientID = p.PatientID
       WHERE a.PatientID IN (?) AND a.IsDeleted = false 
       ORDER BY a.AdmittedAt DESC`,
      [patientIds]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
