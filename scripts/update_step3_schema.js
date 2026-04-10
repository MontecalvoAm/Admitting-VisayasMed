const mysql = require('mysql2/promise');
const path = require('path');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Fetching form...');
    const [forms] = await connection.execute('SELECT id FROM M_Forms WHERE schema_name = ?', ['patient-admission']);
    if (forms.length === 0) {
      console.error('Form "patient-admission" not found.');
      return;
    }
    const formId = forms[0].id;

    console.log('Fetching steps...');
    const [steps] = await connection.execute('SELECT id, label FROM M_FormSteps WHERE form_id = ? ORDER BY order_index ASC', [formId]);
    
    // Step 3 is index 2
    if (steps.length < 3) {
      console.error('Step 3 not found.');
      return;
    }
    const step3 = steps[2];
    console.log(`Found Step 3: ${step3.label} (ID: ${step3.id})`);

    // Fetch existing fields for Step 3
    const [fields] = await connection.execute('SELECT id, name, order_index FROM M_FormFields WHERE step_id = ? ORDER BY order_index ASC', [step3.id]);
    
    // Find EmergencyContactName and ResponsibleName
    const emergencyIndex = fields.findIndex(f => f.name === 'EmergencyContactName');
    const responsibleIndex = fields.findIndex(f => f.name === 'ResponsibleName');

    if (emergencyIndex === -1 || responsibleIndex === -1) {
      console.error('Could not find target fields for insertion.');
      return;
    }

    console.log('Inserting "Emergency Contact" section header...');
    // We will insert before EmergencyContactName. 
    // We need to shift everything after.
    
    // Actually, it's easier to just insert with fractional order or re-index everything.
    // Let's re-index everything with a gap of 10.
    
    for (let i = 0; i < fields.length; i++) {
        await connection.execute('UPDATE M_FormFields SET order_index = ? WHERE id = ?', [(i + 1) * 10, fields[i].id]);
    }

    // Insert Section 1 at order 5
    await connection.execute(
        'INSERT INTO M_FormFields (id, form_id, step_id, label, name, type, is_required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [`patient-admission_section_emergency_${Date.now()}`, formId, step3.id, 'Emergency Contact', 'SectionEmergency', 'section', 0, 5]
    );

    // Insert Section 2 at order responsibleIndex * 10 + 5
    // Wait, the responsibleIndex is now (responsibleIndex + 1) * 10.
    // So we insert at responsibleIndex * 10 + 5.
    await connection.execute(
        'INSERT INTO M_FormFields (id, form_id, step_id, label, name, type, is_required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [`patient-admission_section_responsible_${Date.now()}`, formId, step3.id, 'Responsible for Account', 'SectionResponsible', 'section', 0, (responsibleIndex * 10) + 5]
    );

    console.log('Migration complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

migrate();
