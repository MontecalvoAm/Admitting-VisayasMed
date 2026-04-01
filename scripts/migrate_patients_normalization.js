const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('--- Starting Normalization Migration ---');

    // 1. Create M_Patients_New table
    console.log('Creating M_Patients_New...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS M_Patients_New (
        PatientID INT AUTO_INCREMENT PRIMARY KEY,
        LastName VARCHAR(100) NOT NULL,
        GivenName VARCHAR(100) NOT NULL,
        MiddleName VARCHAR(100),
        Suffix VARCHAR(20),
        Birthday DATE,
        BirthPlace VARCHAR(255),
        Sex VARCHAR(20),
        ContactNumber VARCHAR(50),
        CityAddress TEXT,
        ProvincialAddress TEXT,
        CivilStatus VARCHAR(50),
        Religion VARCHAR(100),
        Citizenship VARCHAR(100),
        Occupation VARCHAR(100),
        FatherFamilyName VARCHAR(100),
        FatherGivenName VARCHAR(100),
        FatherMiddleName VARCHAR(100),
        FatherContact VARCHAR(50),
        MotherFamilyName VARCHAR(100),
        MotherGivenName VARCHAR(100),
        MotherMiddleName VARCHAR(100),
        MotherContact VARCHAR(50),
        SpouseFamilyName VARCHAR(100),
        SpouseGivenName VARCHAR(100),
        SpouseMiddleName VARCHAR(100),
        SpouseContact VARCHAR(50),
        EmergencyContactName VARCHAR(150),
        EmergencyRelation VARCHAR(100),
        EmergencyContactNumber VARCHAR(50),
        ResponsibleName VARCHAR(150),
        ResponsibleContact VARCHAR(50),
        ResponsibleAddress TEXT,
        ResponsibleRelation VARCHAR(100),
        CreatedBy VARCHAR(100) DEFAULT 'System',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedBy VARCHAR(100),
        UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
        IsDeleted TINYINT(1) DEFAULT 0,
        INDEX idx_patient_name (LastName, GivenName)
      )
    `);

    // 2. Create M_Admissions table
    console.log('Creating M_Admissions...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS M_Admissions (
        AdmissionID INT AUTO_INCREMENT PRIMARY KEY,
        PatientID INT NOT NULL,
        Age INT,
        AttendingPhysician VARCHAR(150),
        PreviouslyAdmitted TINYINT(1) DEFAULT 0,
        PreviousAdmissionDate DATE,
        PhilHealthStatus VARCHAR(100),
        HmoCompany VARCHAR(100),
        VmcBenefit VARCHAR(100),
        ServiceCaseType VARCHAR(100),
        PrintedNameSignature VARCHAR(150),
        RelationToPatientSignature VARCHAR(100),
        NameSignature2 VARCHAR(150),
        AdmittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        CreatedBy VARCHAR(100) DEFAULT 'System',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedBy VARCHAR(100),
        UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
        IsDeleted TINYINT(1) DEFAULT 0,
        CONSTRAINT FK_Admission_Patient FOREIGN KEY (PatientID) REFERENCES M_Patients_New(PatientID),
        INDEX idx_admission_patient (PatientID),
        INDEX idx_admission_date (AdmittedAt)
      )
    `);

    // 3. Migrate unique patients
    console.log('Migrating unique patients...');
    // We group by trimmed names and birthday to ensure unique patient records
    const [existingPatients] = await pool.query(`
      SELECT * FROM M_Patients 
      WHERE IsDeleted = false 
      ORDER BY CreatedAt ASC
    `);

    const patientMap = new Map(); // Key: LN|GN|MN|SF|BD, Value: PatientID

    for (const p of existingPatients) {
      const key = `${p.LastName}|${p.GivenName}|${p.MiddleName || ''}|${p.Suffix || ''}|${p.Birthday?.toISOString() || ''}`.toLowerCase().trim();
      
      if (!patientMap.has(key)) {
        const [result] = await pool.query(`
          INSERT INTO M_Patients_New (
            LastName, GivenName, MiddleName, Suffix, Birthday, BirthPlace, Sex, ContactNumber, CityAddress, ProvincialAddress, CivilStatus, Religion, Citizenship, Occupation,
            FatherFamilyName, FatherGivenName, FatherMiddleName, FatherContact,
            MotherFamilyName, MotherGivenName, MotherMiddleName, MotherContact,
            SpouseFamilyName, SpouseGivenName, SpouseMiddleName, SpouseContact,
            EmergencyContactName, EmergencyRelation, EmergencyContactNumber,
            ResponsibleName, ResponsibleContact, ResponsibleAddress, ResponsibleRelation,
            CreatedBy, CreatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          p.LastName, p.GivenName, p.MiddleName, p.Suffix, p.Birthday, p.BirthPlace, p.Sex, p.ContactNumber, p.CityAddress, p.ProvincialAddress, p.CivilStatus, p.Religion, p.Citizenship, p.Occupation,
          p.FatherFamilyName, p.FatherGivenName, p.FatherMiddleName, p.FatherContact,
          p.MotherFamilyName, p.MotherGivenName, p.MotherMiddleName, p.MotherContact,
          p.SpouseFamilyName, p.SpouseGivenName, p.SpouseMiddleName, p.SpouseContact,
          p.EmergencyContactName, p.EmergencyRelation, p.EmergencyContactNumber,
          p.ResponsibleName, p.ResponsibleContact, p.ResponsibleAddress, p.ResponsibleRelation,
          p.CreatedBy || 'System', p.CreatedAt
        ]);
        
        patientMap.set(key, result.insertId);
      }

      // Record this admission
      const patientId = patientMap.get(key);
      await pool.query(`
        INSERT INTO M_Admissions (
          PatientID, Age, AttendingPhysician, PreviouslyAdmitted, PreviousAdmissionDate, PhilHealthStatus, HmoCompany, VmcBenefit, ServiceCaseType,
          PrintedNameSignature, RelationToPatientSignature, NameSignature2,
          AdmittedAt, CreatedBy, CreatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        patientId, p.Age, p.AttendingPhysician, p.PreviouslyAdmitted, p.PreviousAdmissionDate, p.PhilHealthStatus, p.HmoCompany, p.VmcBenefit, p.ServiceCaseType,
        p.PrintedNameSignature, p.RelationToPatientSignature, p.NameSignature2,
        p.CreatedAt, p.CreatedBy || 'System', p.CreatedAt
      ]);
    }

    console.log(`Migrated ${patientMap.size} unique patients and ${existingPatients.length} admissions.`);

    // 4. Swap Tables (Careful)
    console.log('Renaming tables...');
    await pool.query('RENAME TABLE M_Patients TO M_Patients_Old');
    await pool.query('RENAME TABLE M_Patients_New TO M_Patients');

    console.log('--- Migration completed successfully ---');
    await pool.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
