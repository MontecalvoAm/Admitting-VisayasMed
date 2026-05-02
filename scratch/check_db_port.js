const mysql = require('mysql2/promise');

async function checkPort(port) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: port,
      user: 'root',
      password: '',
      database: 'admitting_db'
    });
    console.log(`Successfully connected on port ${port}`);
    await connection.end();
    return true;
  } catch (err) {
    // console.log(`Failed on port ${port}: ${err.message}`);
    return false;
  }
}

async function run() {
  const commonPorts = [3306, 3307, 8889, 33060];
  for (const port of commonPorts) {
    if (await checkPort(port)) return;
  }
  console.log("Could not find MySQL on common ports.");
}

run();
