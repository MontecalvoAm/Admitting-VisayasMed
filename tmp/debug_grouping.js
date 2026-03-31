import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

function parseEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) config[key.trim()] = value.trim();
  });
  return config;
}

const env = parseEnv();

async function checkData() {
  const pool = mysql.createPool({
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'admitting_db',
  });

  try {
    console.log('--- Schema ---');
    const [columns] = await pool.query('DESCRIBE M_Patients');
    console.log(JSON.stringify(columns, null, 2));

    console.log('\n--- Duplicate Grouping Check ---');
    // This query looks for what SHOULD be same patient but are getting grouped separately
    const [dupes] = await pool.query(`
      SELECT 
        TRIM(LastName) as LN, 
        TRIM(GivenName) as GN, 
        DATE(Birthday) as BD,
        COUNT(DISTINCT TRIM(LastName), TRIM(GivenName), DATE(Birthday)) as D_Count,
        COUNT(*) as Total_Recs,
        GROUP_CONCAT(Id) as Ids
      FROM M_Patients 
      WHERE IsDeleted = false 
      GROUP BY TRIM(LastName), TRIM(GivenName), DATE(Birthday)
    `);
    
    console.log('Total unique groups found:', dupes.length);
    const multiAdmissionGroups = dupes.filter(g => g.Total_Recs > 1);
    console.log('Groups with more than 1 admission:', JSON.stringify(multiAdmissionGroups, null, 2));

    if (multiAdmissionGroups.length === 0) {
        console.log('\nNo groups found with multiple admissions. This suggests Re-Admit is either not saving correctly or the grouping criteria is failing to catch them.');
        const [all] = await pool.query('SELECT Id, LastName, GivenName, Birthday FROM M_Patients LIMIT 10');
        console.log('First 10 records:', JSON.stringify(all, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
