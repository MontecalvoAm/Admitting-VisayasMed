const mysql = require('mysql2/promise');

async function runMigration() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('Adding IsViewed column...');
    await pool.query('ALTER TABLE M_Admissions ADD COLUMN IsViewed TINYINT(1) DEFAULT 0 AFTER IsDeleted');
    console.log('Column added successfully.');
    
    const [rows] = await pool.query('DESCRIBE M_Admissions');
    console.log('Updated Schema:', JSON.stringify(rows, null, 2));
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column IsViewed already exists.');
    } else {
      console.error('Migration failed:', err.message);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
