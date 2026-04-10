const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('Adding ControlNumber column to M_Admissions...');
    await pool.query('ALTER TABLE M_Admissions ADD COLUMN ControlNumber VARCHAR(50) AFTER ServiceCaseType');
    console.log('Successfully added ControlNumber column.');
    
    await pool.end();
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ControlNumber column already exists.');
    } else {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  }
}

migrate();
