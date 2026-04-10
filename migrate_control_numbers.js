const mysql = require('mysql2/promise');

async function migrateData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    const [rows] = await pool.query('SELECT AdmissionID, CreatedAt FROM M_Admissions WHERE ControlNumber IS NULL ORDER BY CreatedAt ASC');
    console.log(`Found ${rows.length} admissions without ControlNumber.`);

    const monthCounters = {};

    for (const row of rows) {
      const date = new Date(row.CreatedAt);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed
      const day = date.getDate();

      const yearMonthKey = `${year}-${month}`;
      if (!monthCounters[yearMonthKey]) {
        monthCounters[yearMonthKey] = 0;
      }
      monthCounters[yearMonthKey]++;

      const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
      const controlNumber = `${dateStr}-${monthCounters[yearMonthKey]}`;

      console.log(`Updating AdmissionID ${row.AdmissionID} with ControlNumber ${controlNumber}`);
      await pool.execute('UPDATE M_Admissions SET ControlNumber = ? WHERE AdmissionID = ?', [controlNumber, row.AdmissionID]);
    }

    console.log('Migration complete.');
    await pool.end();
  } catch (err) {
    console.error('Migration data failed:', err);
    process.exit(1);
  }
}

migrateData();
