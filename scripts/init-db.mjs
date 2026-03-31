import mysql from 'mysql2/promise';

async function initDB() {
  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('Creating database if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS admitting_db');
    await connection.query('USE admitting_db');

    console.log('Creating Admissions table if not exists...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Admissions (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Patient Information
        LastName VARCHAR(255),
        GivenName VARCHAR(255),
        MiddleName VARCHAR(255),
        Suffix VARCHAR(255),
        Age INT,
        Birthday DATE,
        BirthPlace VARCHAR(255),
        Sex ENUM('Male', 'Female'),
        ContactNumber VARCHAR(255),
        CityAddress TEXT,
        ProvincialAddress TEXT,
        CivilStatus VARCHAR(255),
        Religion VARCHAR(255),
        Citizenship VARCHAR(255),
        Occupation VARCHAR(255),
        
        -- Parents Information
        FatherFamilyName VARCHAR(255),
        FatherGivenName VARCHAR(255),
        FatherMiddleName VARCHAR(255),
        FatherContact VARCHAR(255),
        
        MotherFamilyName VARCHAR(255),
        MotherGivenName VARCHAR(255),
        MotherMiddleName VARCHAR(255),
        MotherContact VARCHAR(255),
        
        SpouseFamilyName VARCHAR(255),
        SpouseGivenName VARCHAR(255),
        SpouseMiddleName VARCHAR(255),
        SpouseContact VARCHAR(255),
        
        -- Emergency Contact
        EmergencyContactName VARCHAR(255),
        EmergencyRelation VARCHAR(255),
        EmergencyContactNumber VARCHAR(255),
        
        -- Responsible for Account
        ResponsibleName VARCHAR(255),
        ResponsibleContact VARCHAR(255),
        ResponsibleAddress TEXT,
        ResponsibleRelation VARCHAR(255),
        
        -- Admission Details
        AttendingPhysician VARCHAR(255),
        PreviouslyAdmitted BOOLEAN,
        PreviousAdmissionDate DATE NULL,
        PhilHealthStatus ENUM('Member', 'Dependent', 'Mandatory', 'None'),
        HmoCompany BOOLEAN,
        VmcBenefit ENUM('Employee', 'Dependent', 'None'),
        ServiceCaseType ENUM('Private', 'House Case', 'Charity', 'Project Case'),
        
        -- Signatures
        PrintedNameSignature VARCHAR(255),
        RelationToPatientSignature VARCHAR(255),
        NameSignature2 VARCHAR(255),
        
        -- Audit Columns
        CreatedBy VARCHAR(255),
        CreatedAt DATETIME,
        UpdatedBy VARCHAR(255),
        UpdatedAt DATETIME,
        IsDeleted BOOLEAN DEFAULT FALSE,
        DeletedAt DATETIME,
        DeletedBy VARCHAR(255)
      )
    `;
    
    await connection.query(createTableQuery);
    console.log('Database and Admissions table created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.end();
  }
}

initDB();
