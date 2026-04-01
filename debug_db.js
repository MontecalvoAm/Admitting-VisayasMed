const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'admitting_db',
});

async function checkData() {
  try {
    const [rows] = await pool.query('SELECT PatientID as Id, LastName, GivenName, MiddleName, Suffix, Birthday, CreatedAt FROM M_Patients WHERE IsDeleted = false ORDER BY LastName, GivenName, CreatedAt DESC');
    console.log('--- ALL PATIENTS (TOP 20) ---');
    console.table(rows.slice(0, 20).map(r => ({
      ...r,
      Birthday: r.Birthday ? r.Birthday.toISOString().split('T')[0] : 'NULL',
      CreatedAt: r.CreatedAt ? r.CreatedAt : 'NULL'
    })));

    const [grouped] = await pool.query(`
      SELECT a.PatientID, COUNT(*) as count, TRIM(LastName) as LN, TRIM(GivenName) as GN
      FROM M_Admissions a
      JOIN M_Patients p ON a.PatientID = p.PatientID
      WHERE a.IsDeleted = false
      GROUP BY a.PatientID
      HAVING COUNT(*) > 1
    `);
    console.log('\n--- DUPLICATE GROUPS (New Resilient Logic) ---');
    console.table(grouped);

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
