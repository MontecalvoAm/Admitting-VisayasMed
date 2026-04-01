const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchemas() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'admitting_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const [rows] = await pool.execute('SELECT id, schema_name, HEX(id) as hex_id FROM form_schemas');
    console.log('--- Form Schemas ---');
    console.table(rows);

    const [desc] = await pool.execute('DESCRIBE form_schemas');
    console.log('--- Schema Description ---');
    console.table(desc);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchemas();
