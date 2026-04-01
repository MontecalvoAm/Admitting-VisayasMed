const pool = require('./lib/db.js');

async function check() {
  try {
    const [rows] = await pool.default.query('SELECT DISTINCT CaseType FROM M_Patients');
    console.log('Case Types:', rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
