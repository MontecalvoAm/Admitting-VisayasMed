-- scripts/01_hyper_scale_indexes.sql
-- Run this script to add B-Tree indices to the database, optimizing lookups for millions of records.

-- 1. Index for Patient Searching (LastName, GivenName)
-- Often searched together in `patients/page.tsx`
CREATE INDEX idx_patients_name ON M_Patients(LastName, GivenName);

-- 2. Index for Patient Soft-Deletes
-- Used in almost every single WHERE clause (IsDeleted = false)
CREATE INDEX idx_patients_isdeleted ON M_Patients(IsDeleted);

-- 3. Composite Index for Admission Date Filters
CREATE INDEX idx_admissions_admitted_at ON M_Admissions(PatientID, AdmittedAt, IsDeleted);

-- 4. Index for Case Type Lookups
CREATE INDEX idx_admissions_casetype ON M_Admissions(ServiceCaseType);

-- 5. User Email Unique Index (Since users login via Email)
CREATE UNIQUE INDEX idx_users_email ON M_Users(Email);

-- 6. Admission History Lookups
CREATE INDEX idx_admissions_patientid ON M_Admissions(PatientID, IsDeleted);
