const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'admitting_db'
    });
    console.log("Connected successfully!");
    const [rows] = await connection.execute("SHOW TABLES");
    console.log("Tables:", rows);
    await connection.end();
  } catch (err) {
    console.error("Connection failed:", JSON.stringify(err, null, 2));
    console.error("Stack:", err.stack);
  }
}

test();
