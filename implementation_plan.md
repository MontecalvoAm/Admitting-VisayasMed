# Admitting Patient Information System Plan

This document outlines the architecture, database schema, and implementation steps for building the Admitting Patient Information web application.

## User Review Required

> [!IMPORTANT]
> Please review the proposed Database Schema to ensure all necessary fields cover your operational requirements. Also, confirm if you already have a specific database name in XAMPP you would like to use, or if we should create a new one named `vismed_admitting`.

## Tech Stack
- **Frontend/Backend:** Next.js (App Router)
- **Styling:** Tailwind CSS (Premium, modern, clean aesthetic)
- **Database:** MySQL (via XAMPP)
- **Database Driver:** `mysql2` package for Node.js

## Proposed Database Schema

We will create a specific table (e.g., `admissions`) to capture all fields in the form.

### Table: `admissions`

**1. Patient Information**
- `id` (INT, Primary Key, Auto Increment)
- `last_name`, `given_name`, `middle_name`, `suffix` (VARCHAR)
- `age` (INT)
- `birthday` (DATE)
- `birth_place` (VARCHAR)
- `sex` (ENUM: 'Male', 'Female')
- `contact_number` (VARCHAR)
- `city_address`, `provincial_address` (TEXT)
- `civil_status` (VARCHAR)
- `religion` (VARCHAR)
- `citizenship` (VARCHAR)
- `occupation` (VARCHAR)

**2. Parents Information**
- `father_family_name`, `father_given_name`, `father_middle_name`, `father_contact` (VARCHAR)
- `mother_family_name`, `mother_given_name`, `mother_middle_name`, `mother_contact` (VARCHAR)
- `spouse_family_name`, `spouse_given_name`, `spouse_middle_name`, `spouse_contact` (VARCHAR)

**3. Emergency Contact**
- `emergency_name` (VARCHAR)
- `emergency_relation` (VARCHAR)
- `emergency_contact` (VARCHAR)

**4. Responsible for Account**
- `responsible_name` (VARCHAR)
- `responsible_contact` (VARCHAR)
- `responsible_address` (TEXT)
- `responsible_relation` (VARCHAR)

**5. Admission Details**
- `attending_physician` (VARCHAR)
- `previously_admitted` (BOOLEAN)
- `previous_admission_date` (VARCHAR/DATE)
- `philhealth_status` (ENUM: 'Member', 'Dependent', 'Mandatory', 'None')
- `hmo_company` (BOOLEAN)
- `vmc_benefit` (ENUM: 'Employee', 'Dependent', 'None')
- `service_case_type` (ENUM: 'Private', 'House Case', 'Charity/Package', 'Project Case')

**6. Signatures (Text representations for the form)**
- `printed_name_signature` (VARCHAR)
- `relation_to_patient_signature` (VARCHAR)
- `name_signature_2` (VARCHAR)

## Proposed Changes and File Structure

### Project Initialization
We will initialize the project in `c:/Users/FRANCIE SIOCO/Aljon/Vismed/Admitting`.
We will run: `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`

### Application Structure
#### `src/lib/db.ts`
Database connection utility using `mysql2/promise` to connect to the XAMPP MySQL server.

#### `src/app/api/admit/route.ts`
Next.js API route to handle `POST` requests from the form. It will validate the payload and insert a new row into the `admissions` table.

#### `src/app/page.tsx`
The main interactive form page.
- We will split the massive form into visual, collapsible sections or a sleek card-based layout to prevent user fatigue.
- State management will handle form inputs.

#### Components
To keep the code clean, we will create sub-components for each logical block:
- `PatientInfoSection`
- `ParentsInfoSection`
- `EmergencyContactSection`
- `AccountResponsibilitySection`
- `AdmissionDetailsSection`

## Verification Plan

### Database Verification
- Ensure XAMPP MySQL is running.
- Execute the SQL table creation script.
- Verify that a test submission correctly appears in the database via PhpMyAdmin or the MySQL console.

### Functional Verification
- Test all input fields for correct data binding.
- Ensure conditional fields (like "When?" under previously admitted) toggle correctly.
- Perform a simulated form submission and verify the success/error UI states.
