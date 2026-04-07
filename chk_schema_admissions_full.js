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
    admissions.forEach(col => console.log(JSON.stringify(col)));
    
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
