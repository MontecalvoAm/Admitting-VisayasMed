import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.LastName || !data.GivenName) {
      return NextResponse.json({ error: 'LastName and GivenName are required.' }, { status: 400 });
    }

    // 1. Transactional approach: Find or Create Patient, then record Admission
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if patient exists (Name + Birthday match)
      const [existing] = await connection.query<RowDataPacket[]>(
        `SELECT PatientID FROM M_Patients 
         WHERE TRIM(LOWER(LastName)) = TRIM(LOWER(?)) 
           AND TRIM(LOWER(GivenName)) = TRIM(LOWER(?)) 
           AND (Birthday = ? OR (Birthday IS NULL AND ? IS NULL))
           AND IsDeleted = false 
         LIMIT 1`,
        [data.LastName, data.GivenName, data.Birthday || null, data.Birthday || null]
      );

      let patientId: number;

      if (existing.length > 0) {
        patientId = existing[0].PatientID;
        // Optionally update patient info here if needed
      } else {
        // Create new patient
        const [patientResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO M_Patients (
            LastName, GivenName, MiddleName, Suffix, Birthday, BirthPlace, Sex, 
            ContactNumber, CityAddress, ProvincialAddress, CivilStatus, Religion, Citizenship, Occupation,
            FatherFamilyName, FatherGivenName, FatherMiddleName, FatherContact,
            MotherFamilyName, MotherGivenName, MotherMiddleName, MotherContact,
            SpouseFamilyName, SpouseGivenName, SpouseMiddleName, SpouseContact,
            EmergencyContactName, EmergencyRelation, EmergencyContactNumber,
            ResponsibleName, ResponsibleContact, ResponsibleAddress, ResponsibleRelation,
            CreatedBy, CreatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            data.LastName || null, data.GivenName || null, data.MiddleName || null, data.Suffix || null, data.Birthday || null, data.BirthPlace || null, data.Sex || null, 
            data.ContactNumber || null, data.CityAddress || null, data.ProvincialAddress || null, data.CivilStatus || null, data.Religion || null, data.Citizenship || null, data.Occupation || null,
            data.FatherFamilyName || null, data.FatherGivenName || null, data.FatherMiddleName || null, data.FatherContact || null,
            data.MotherFamilyName || null, data.MotherGivenName || null, data.MotherMiddleName || null, data.MotherContact || null,
            data.SpouseFamilyName || null, data.SpouseGivenName || null, data.SpouseMiddleName || null, data.SpouseContact || null,
            data.EmergencyContactName || null, data.EmergencyRelation || null, data.EmergencyContactNumber || null,
            data.ResponsibleName || null, data.ResponsibleContact || null, data.ResponsibleAddress || null, data.ResponsibleRelation || null,
            'System', 
          ]
        );
        patientId = patientResult.insertId;
      }

      // 2. Calculate ControlNumber (YYYYMMDD-N, reset monthly)
      const now = new Date();
      const dateString = now.getFullYear().toString() + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + 
                         now.getDate().toString().padStart(2, '0');
      
      const [countResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM M_Admissions 
         WHERE YEAR(CreatedAt) = YEAR(CURRENT_TIMESTAMP) 
           AND MONTH(CreatedAt) = MONTH(CURRENT_TIMESTAMP)`
      );
      const sequence = (countResult[0]?.count || 0) + 1;
      const controlNumber = `${dateString}-${sequence}`;

      // 3. Create Admission Record
      const [admissionResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO M_Admissions (
          PatientID, Age, AttendingPhysician, PreviouslyAdmitted, PreviousAdmissionDate, PhilHealthStatus, 
          HmoCompany, VmcBenefit, ServiceCaseType, ControlNumber,
          PrintedNameSignature, RelationToPatientSignature, NameSignature2,
          CreatedBy, AdmittedAt, CreatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          patientId, data.Age || null, data.AttendingPhysician || null, data.PreviouslyAdmitted || false, 
          data.PreviousAdmissionDate || null, data.PhilHealthStatus || null, data.HmoCompany || false, 
          data.VmcBenefit || null, data.ServiceCaseType || null, controlNumber,
          data.PrintedNameSignature || null, data.RelationToPatientSignature || null, data.NameSignature2 || null,
          'System'
        ]
      );

      await connection.commit();
      
      return NextResponse.json({ success: true, insertId: admissionResult.insertId, patientId, controlNumber }, { status: 201 });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error submitting admission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
