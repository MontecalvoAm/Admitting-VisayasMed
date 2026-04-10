const mysql = require('mysql2/promise');

async function verifyLogic() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    console.log('Verifying ControlNumber logic...');
    
    // Simulate what the API does
    const now = new Date();
    const dateString = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
    
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as count FROM M_Admissions 
       WHERE YEAR(CreatedAt) = YEAR(CURRENT_TIMESTAMP) 
         AND MONTH(CreatedAt) = MONTH(CURRENT_TIMESTAMP)`
    );
    const sequence = (countResult[0]?.count || 0) + 1;
    const controlNumber = `${dateString}-${sequence}`;
    
    console.log(`Generated ControlNumber: ${controlNumber}`);

    // Insert a dummy record
    const [result] = await pool.execute(
      `INSERT INTO M_Admissions (PatientID, Age, ControlNumber, CreatedBy) VALUES (7, 99, ?, 'TestRunner')`,
      [controlNumber]
    );
    const insertId = result.insertId;
    
    // Verify it was saved correctly
    const [saved] = await pool.query('SELECT ControlNumber FROM M_Admissions WHERE AdmissionID = ?', [insertId]);
    console.log(`Saved ControlNumber: ${saved[0].ControlNumber}`);
    
    if (saved[0].ControlNumber === controlNumber) {
      console.log('PASS: Database persistence verified.');
    } else {
      console.error('FAIL: ControlNumber mismatch.');
    }

    // Clean up
    await pool.execute('DELETE FROM M_Admissions WHERE AdmissionID = ?', [insertId]);
    console.log('Cleanup complete.');

    await pool.end();
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verifyLogic();
