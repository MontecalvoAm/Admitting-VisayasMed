// Re-seed the patient-admission schema with ALL fields from page.tsx (steps 1-3)
// Run: node scripts/seed_patient_admission_schema.mjs
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnv() {
  try {
    const content = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch { return {}; }
}

const env = readEnv();
const pool = await mysql.createPool({
  host: env.DB_HOST || 'localhost',
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'admitting_db',
});

const steps = [
  { id: 'step-1', label: 'Patient Information', order: 1 },
  { id: 'step-2', label: 'Family & Relatives', order: 2 },
  { id: 'step-3', label: 'Emergency & Account', order: 3 },
];

const fields = [
  // Step 1 — Patient Information (15 fields)
  { id: 'f-s1-01', label: 'Last Name',          name: 'LastName',           type: 'text',   stepId: 'step-1', required: true,  placeholder: 'e.g. Doe',    options: [] },
  { id: 'f-s1-02', label: 'Given Name',          name: 'GivenName',          type: 'text',   stepId: 'step-1', required: true,  placeholder: 'e.g. John',   options: [] },
  { id: 'f-s1-03', label: 'Middle Name',         name: 'MiddleName',         type: 'text',   stepId: 'step-1', required: false, placeholder: '',            options: [] },
  { id: 'f-s1-04', label: 'Suffix',              name: 'Suffix',             type: 'text',   stepId: 'step-1', required: false, placeholder: 'e.g. Jr, III',options: [] },
  { id: 'f-s1-05', label: 'Age',                 name: 'Age',                type: 'number', stepId: 'step-1', required: true,  placeholder: 'Auto-calculated from Birthday', options: [] },
  { id: 'f-s1-06', label: 'Birthday',            name: 'Birthday',           type: 'date',   stepId: 'step-1', required: true,  placeholder: '',            options: [] },
  { id: 'f-s1-07', label: 'Birthplace',          name: 'BirthPlace',         type: 'text',   stepId: 'step-1', required: true,  placeholder: '',            options: [] },
  { id: 'f-s1-08', label: 'Sex',                 name: 'Sex',                type: 'select', stepId: 'step-1', required: true,  placeholder: '',
    options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }] },
  { id: 'f-s1-09', label: 'Contact Number',      name: 'ContactNumber',      type: 'tel',    stepId: 'step-1', required: true,  placeholder: '',            options: [] },
  { id: 'f-s1-10', label: 'Civil Status',        name: 'CivilStatus',        type: 'select', stepId: 'step-1', required: true,  placeholder: '',
    options: [{ value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }, { value: 'Widowed', label: 'Widowed' }, { value: 'Divorced', label: 'Divorced' }] },
  { id: 'f-s1-11', label: 'Religion',            name: 'Religion',           type: 'text',   stepId: 'step-1', required: false, placeholder: '',            options: [] },
  { id: 'f-s1-12', label: 'Citizenship',         name: 'Citizenship',        type: 'text',   stepId: 'step-1', required: true,  placeholder: '',            options: [] },
  { id: 'f-s1-13', label: 'City / Local Address',name: 'CityAddress',        type: 'text',   stepId: 'step-1', required: true,  placeholder: '',            options: [] },
  { id: 'f-s1-14', label: 'Provincial Address',  name: 'ProvincialAddress',  type: 'text',   stepId: 'step-1', required: false, placeholder: '',            options: [] },
  { id: 'f-s1-15', label: 'Occupation',          name: 'Occupation',         type: 'text',   stepId: 'step-1', required: true,  placeholder: '',            options: [] },

  // Step 2 — Family & Relatives (12 fields)
  { id: 'f-s2-01', label: "Father's Family Name", name: 'FatherFamilyName', type: 'text', stepId: 'step-2', required: true,  placeholder: '', options: [] },
  { id: 'f-s2-02', label: "Father's Given Name",  name: 'FatherGivenName',  type: 'text', stepId: 'step-2', required: true,  placeholder: '', options: [] },
  { id: 'f-s2-03', label: "Father's Middle Name", name: 'FatherMiddleName', type: 'text', stepId: 'step-2', required: false, placeholder: '', options: [] },
  { id: 'f-s2-04', label: "Father's Contact No.", name: 'FatherContact',    type: 'tel',  stepId: 'step-2', required: false, placeholder: '', options: [] },
  { id: 'f-s2-05', label: "Mother's Family Name", name: 'MotherFamilyName', type: 'text', stepId: 'step-2', required: true,  placeholder: '', options: [] },
  { id: 'f-s2-06', label: "Mother's Given Name",  name: 'MotherGivenName',  type: 'text', stepId: 'step-2', required: true,  placeholder: '', options: [] },
  { id: 'f-s2-07', label: "Mother's Middle Name", name: 'MotherMiddleName', type: 'text', stepId: 'step-2', required: false, placeholder: '', options: [] },
  { id: 'f-s2-08', label: "Mother's Contact No.", name: 'MotherContact',    type: 'tel',  stepId: 'step-2', required: false, placeholder: '', options: [] },
  { id: 'f-s2-09', label: "Spouse Family Name",   name: 'SpouseFamilyName', type: 'text', stepId: 'step-2', required: false, placeholder: 'N/A if not applicable', options: [] },
  { id: 'f-s2-10', label: "Spouse Given Name",    name: 'SpouseGivenName',  type: 'text', stepId: 'step-2', required: false, placeholder: 'N/A if not applicable', options: [] },
  { id: 'f-s2-11', label: "Spouse Middle Name",   name: 'SpouseMiddleName', type: 'text', stepId: 'step-2', required: false, placeholder: '', options: [] },
  { id: 'f-s2-12', label: "Spouse Contact No.",   name: 'SpouseContact',    type: 'tel',  stepId: 'step-2', required: false, placeholder: '', options: [] },

  // Step 3 — Emergency & Account (7 fields)
  { id: 'f-s3-01', label: 'Emergency Contact Name',   name: 'EmergencyContactName',   type: 'text', stepId: 'step-3', required: true,  placeholder: '', options: [] },
  { id: 'f-s3-02', label: 'Emergency Relation',       name: 'EmergencyRelation',       type: 'text', stepId: 'step-3', required: true,  placeholder: '', options: [] },
  { id: 'f-s3-03', label: 'Emergency Contact Number', name: 'EmergencyContactNumber',  type: 'tel',  stepId: 'step-3', required: true,  placeholder: '', options: [] },
  { id: 'f-s3-04', label: 'Responsible Person Name',  name: 'ResponsibleName',         type: 'text', stepId: 'step-3', required: true,  placeholder: '', options: [] },
  { id: 'f-s3-05', label: 'Responsible Relation',     name: 'ResponsibleRelation',     type: 'text', stepId: 'step-3', required: true,  placeholder: '', options: [] },
  { id: 'f-s3-06', label: 'Responsible Contact',      name: 'ResponsibleContact',      type: 'tel',  stepId: 'step-3', required: true,  placeholder: '', options: [] },
  { id: 'f-s3-07', label: 'Responsible Address',      name: 'ResponsibleAddress',      type: 'text', stepId: 'step-3', required: true,  placeholder: '', options: [] },
];

// Delete old and re-insert
await pool.execute("DELETE FROM form_schemas WHERE schema_name = 'patient-admission'");
await pool.execute(
  'INSERT INTO form_schemas (schema_name, steps, fields) VALUES (?, ?, ?)',
  ['patient-admission', JSON.stringify(steps), JSON.stringify(fields)]
);
console.log(`✅ Seeded patient-admission schema: ${steps.length} steps, ${fields.length} fields.`);
await pool.end();
