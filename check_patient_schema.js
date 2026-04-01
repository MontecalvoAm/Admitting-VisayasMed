const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });
  try {
    const [rows] = await pool.execute('SELECT steps, fields FROM form_schemas WHERE schema_name = "patient-admission"');
    const row = rows[0];
    const steps = typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps;
    const fields = typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields;
    console.log('Steps Count:', steps.length);
    console.log('Fields Count:', fields.length);
    console.log('Steps:', steps);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
