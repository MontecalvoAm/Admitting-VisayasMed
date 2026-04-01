const mysql = require('mysql2/promise');

async function verifyPersistence() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    const schemaName = 'patient-admission';
    
    // 1. Get current schema
    const [rows] = await pool.execute('SELECT * FROM form_schemas WHERE schema_name = ?', [schemaName]);
    const schema = rows[0];
    const steps = JSON.parse(schema.steps);
    const fields = JSON.parse(schema.fields);
    
    console.log('Original steps count:', steps.length);
    
    if (steps.length < 2) {
      console.log('Not enough steps to test deletion safely. Add steps manually first.');
      return;
    }
    
    const stepToDelete = steps[steps.length - 1]; // Delete the last one
    const newSteps = steps.filter(s => s.id !== stepToDelete.id);
    const newFields = fields.filter(f => f.stepId !== stepToDelete.id);
    
    console.log(`Deleting step: ${stepToDelete.label} (${stepToDelete.id})`);
    
    // 2. Perform Update (Simulate PUT)
    await pool.execute(
      'UPDATE form_schemas SET steps = ?, fields = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(newSteps), JSON.stringify(newFields), schema.id]
    );
    
    console.log('Update successful.');

    // 3. Verify immediately
    const [rowsAfter] = await pool.execute('SELECT steps FROM form_schemas WHERE id = ?', [schema.id]);
    const stepsAfter = JSON.parse(rowsAfter[0].steps);
    console.log('Steps count after update:', stepsAfter.length);
    
    if (stepsAfter.length === newSteps.length) {
      console.log('Verification Success: Changes persisted in DB.');
    } else {
      console.error('Verification Failure: Steps count mismatch!');
    }

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    pool.end();
  }
}

verifyPersistence();
