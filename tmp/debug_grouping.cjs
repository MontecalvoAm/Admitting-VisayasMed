const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function parseEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      config[key] = value;
    }
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
    console.log('\n--- All records with grouping keys ---');
    const [all] = await pool.query(`
        SELECT 
            Id, 
            LastName, 
            GivenName, 
            Birthday,
            TRIM(LastName) as T_LN,
            TRIM(GivenName) as T_GN,
            DATE(Birthday) as D_BD,
            CAST(DATE(Birthday) AS CHAR) as S_BD
        FROM M_Patients 
        WHERE IsDeleted = false 
        ORDER BY CreatedAt DESC
    `);
    console.log(JSON.stringify(all, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
