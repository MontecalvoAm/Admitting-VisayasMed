const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db'
  });
  
  try {
    const [rows] = await pool.execute('SELECT * FROM form_schemas WHERE schema_name = "patient-admission"');
    console.log(JSON.stringify(rows[0], null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

test();
