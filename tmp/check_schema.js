const mysql = require('mysql2/promise');

async function checkSchema() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admitting_db',
  });

  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      console.log(`\nSchema for ${tableName}:`);
      console.table(columns);
    }

    await pool.end();
  } catch (err) {
    console.error(err);
  }
}

checkSchema();
