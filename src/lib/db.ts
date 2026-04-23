import mysql from 'mysql2/promise';

const writePool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admitting_db',
  waitForConnections: true,
  connectionLimit: 50, // Write connections
  queueLimit: 0,
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const readPool = mysql.createPool({
  host: process.env.DB_READ_HOST || process.env.DB_HOST || 'localhost', // Allows pointing to read-replica
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admitting_db',
  waitForConnections: true,
  connectionLimit: 100, // Read queries can scale higher
  queueLimit: 0,
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// For backward compatibility, the default pool acts as the write pool.
// Refactor queries that only read data to use `readPool` directly.
export default writePool;
