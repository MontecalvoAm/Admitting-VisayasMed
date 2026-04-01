const mysql = require('mysql2/promise');

async function consolidate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
    connectionLimit: 10
  });

  try {
    console.log('--- Starting Patient Consolidation ---');

    // 1. Identify patients with the same LastName and GivenName
    const [duplicates] = await pool.query(`
      SELECT LOWER(TRIM(LastName)) as LN, LOWER(TRIM(GivenName)) as GN, COUNT(*) as pCount
      FROM M_Patients
      WHERE IsDeleted = false
      GROUP BY LN, GN
      HAVING pCount > 1
    `);

    console.log(`Found ${duplicates.length} duplicate name groups.`);

    for (const group of duplicates) {
      console.log(`\nProcessing group: ${group.LN}, ${group.GN}`);

      // 2. Get all patient IDs for this group, ordered by latest CreatedAt (we'll keep the newest/most complete)
      const [patients] = await pool.query(`
        SELECT PatientID, Birthday, MiddleName, Suffix, CityAddress
        FROM M_Patients
        WHERE LOWER(TRIM(LastName)) = ? AND LOWER(TRIM(GivenName)) = ? AND IsDeleted = false
        ORDER BY CreatedAt DESC
      `, [group.LN, group.GN]);

      if (patients.length <= 1) continue;

      const primaryPatient = patients[0];
      const primaryId = primaryPatient.PatientID;
      const otherIds = patients.slice(1).map(p => p.PatientID);

      console.log(`Primary Patient ID: ${primaryId}. Duplicates to merge: ${otherIds.join(', ')}`);

      // 3. Re-map admissions from other IDs to the primary ID
      const [moveAdmissions] = await pool.query(`
        UPDATE M_Admissions
        SET PatientID = ?
        WHERE PatientID IN (?)
      `, [primaryId, otherIds]);

      console.log(`Moved ${moveAdmissions.affectedRows} admissions to primary patient.`);

      // 4. Soft-delete the other patient records
      const [deletePatients] = await pool.query(`
        UPDATE M_Patients
        SET IsDeleted = true, DeletedBy = 'System/Consolidator', DeletedAt = CURRENT_TIMESTAMP
        WHERE PatientID IN (?)
      `, [otherIds]);

      console.log(`Soft-deleted ${deletePatients.affectedRows} redundant patient records.`);
    }

    console.log('\n--- Consolidation Complete! ---');

  } catch (error) {
    console.error('Consolidation failed:', error);
  } finally {
    await pool.end();
  }
}

consolidate();
