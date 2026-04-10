const mysql = require('mysql2/promise');

async function checkSchema() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    const [admissions] = await pool.query('DESCRIBE M_Admissions');
    console.log('--- M_Admissions ---');
    console.table(admissions);

    const [patients] = await pool.query('DESCRIBE M_Patients');
    console.log('--- M_Patients ---');
    console.table(patients);
    
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
