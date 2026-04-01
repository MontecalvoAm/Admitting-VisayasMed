const mysql = require('mysql2/promise');

async function checkFormsRBAC() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  const [rows] = await connection.execute('SELECT * FROM m_rolepermissions WHERE ModuleName = "Forms"');
  console.log('--- FORMS RBAC ROWS ---');
  console.log(rows);
  console.log('------------------------');

  await connection.end();
}

checkFormsRBAC().catch(console.error);
