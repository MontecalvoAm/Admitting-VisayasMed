-- Add missing columns to M_Patients if they don't exist
ALTER TABLE M_Patients 
ADD COLUMN IF NOT EXISTS PhilHealthStatus VARCHAR(50),
ADD COLUMN IF NOT EXISTS VmcBenefit VARCHAR(50),
ADD COLUMN IF NOT EXISTS HmoCompany BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS PreviouslyAdmitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS PreviousAdmissionDate DATETIME;

-- Ensure ServiceCaseType has the new options if it's an ENUM (though it's likely VARCHAR)
-- If it's VARCHAR, nothing to do. If it's ENUM, you might need to update it.
-- ALTER TABLE M_Patients MODIFY COLUMN ServiceCaseType VARCHAR(50);
