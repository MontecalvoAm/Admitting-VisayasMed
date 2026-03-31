// Run: node scripts/run_migration.mjs
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local manually (no dotenv dependency needed)
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
    return {};
  }
}

const env = readEnv();

const pool = await mysql.createPool({
  host: env.DB_HOST || 'localhost',
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'admitting_db',
  multipleStatements: true,
});

const sql = readFileSync(join(__dirname, 'create_form_schemas_table.sql'), 'utf8');

console.log('Running migration...');
await pool.query(sql);
console.log('✅ Migration complete — form_schemas table created and seeded.');
await pool.end();
