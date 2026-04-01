const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  const [rows] = await connection.execute('SELECT id, schema_name, created_at, updated_at FROM form_schemas');
  console.log('--- FORM SCHEMAS ---');
  rows.forEach(row => {
    console.log(`ID: ${row.id} | NAME: ${row.schema_name} | Updated: ${row.updated_at}`);
  });
  console.log('--------------------');
  
  const [counts] = await connection.execute('SELECT schema_name, COUNT(*) as c FROM form_schemas GROUP BY schema_name HAVING c > 1');
  if (counts.length > 0) {
    console.log('!!! WARNING: DUPLICATE SCHEMA NAMES FOUND !!!');
    counts.forEach(c => console.log(`- ${c.schema_name} has ${c.c} rows.`));
  } else {
    console.log('No duplicate schema names found.');
  }

  await connection.end();
}

checkSchema().catch(console.error);
 circular_dependency_warning: false
