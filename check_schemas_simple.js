const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });
  try {
    const [rows] = await pool.execute('SELECT id, schema_name FROM form_schemas');
    console.log('Schemes:', rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
