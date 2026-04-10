import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('Ensuring M_Patients has DeletedAt and DeletedBy...');
    
    // Attempt adding columns using try-catch to ignore if they already exist
    try {
      await pool.query('ALTER TABLE M_Patients ADD COLUMN DeletedAt DATETIME');
      console.log('Added DeletedAt to M_Patients');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message);
    }

    try {
      await pool.query('ALTER TABLE M_Patients ADD COLUMN DeletedBy VARCHAR(100)');
      console.log('Added DeletedBy to M_Patients');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message);
    }
    
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
