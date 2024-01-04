require('dotenv').config();
const mysql = require('mysql2/promise');
const { createPool } = require('generic-pool');

const pool = createPool({
  create: async () => {
    return await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
    });
  },
  destroy: async (connection) => {
    await connection.end();
  }
});

module.exports = { pool: pool };
