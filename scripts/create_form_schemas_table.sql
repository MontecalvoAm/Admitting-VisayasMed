-- Dynamic Form Schema Table
-- Run this script to create the form_schemas table

CREATE TABLE IF NOT EXISTS form_schemas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schema_name VARCHAR(100) NOT NULL UNIQUE,
  steps JSON NOT NULL,
  fields JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed a default "Doctor Registration" schema
INSERT INTO form_schemas (schema_name, steps, fields)
VALUES (
  'doctor-registration',
  '[{"id":"step-1","label":"Doctor Information","order":1},{"id":"step-2","label":"Contact & Schedule","order":2}]',
  '[
    {"id":"f1","label":"Last Name","name":"LastName","type":"text","stepId":"step-1","required":true,"placeholder":"e.g. Santos","options":[]},
    {"id":"f2","label":"First Name","name":"FirstName","type":"text","stepId":"step-1","required":true,"placeholder":"e.g. Juan","options":[]},
    {"id":"f3","label":"Middle Name","name":"MiddleName","type":"text","stepId":"step-1","required":false,"placeholder":"","options":[]},
    {"id":"f4","label":"Specialty","name":"Specialty","type":"select","stepId":"step-1","required":true,"placeholder":"","options":[{"value":"Cardiology","label":"Cardiology"},{"value":"Pediatrics","label":"Pediatrics"},{"value":"Orthopedics","label":"Orthopedics"},{"value":"Neurology","label":"Neurology"},{"value":"Dermatology","label":"Dermatology"},{"value":"General Medicine","label":"General Medicine"}]},
    {"id":"f5","label":"License Number","name":"LicenseNumber","type":"text","stepId":"step-1","required":true,"placeholder":"e.g. 0012345","options":[]},
    {"id":"f6","label":"Email Address","name":"Email","type":"email","stepId":"step-2","required":true,"placeholder":"e.g. doctor@vismed.com","options":[]},
    {"id":"f7","label":"Phone Number","name":"PhoneNumber","type":"tel","stepId":"step-2","required":true,"placeholder":"+63 9XX XXX XXXX","options":[]},
    {"id":"f8","label":"Schedule Days","name":"ScheduleDays","type":"text","stepId":"step-2","required":false,"placeholder":"e.g. Mon, Wed, Fri","options":[]}
  ]'
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
