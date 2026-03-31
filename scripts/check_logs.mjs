import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnv() {
  try {
    const content = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
    return env;
  } catch {
    return {
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'admitting_db'
    };
  }
}

const env = readEnv();

async function check() {
  const pool = await mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  console.log('Checking M_AuditLogs table...');
  const [rows] = await pool.query('SELECT * FROM M_AuditLogs ORDER BY CreatedAt DESC LIMIT 5');
  console.log('Recent Logs:', JSON.stringify(rows, null, 2));

  console.log('Checking RBAC Module Registration...');
  const [modules] = await pool.query("SELECT * FROM M_Modules WHERE ModuleName = 'Logs'");
  console.log('Logs Module:', JSON.stringify(modules, null, 2));

  await pool.end();
}

check();
