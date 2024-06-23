require('dotenv').config();
const mysql = require('mysql2/promise');
const { createPool } = require('generic-pool');
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

const createConnectionWithRetry = async () => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
      });
      // console.log("New connection created");
      return connection;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        retries += 1;
        console.error(`Error creating new connection: ${error.message}. Retrying in ${RETRY_DELAY / 1000} seconds... (${retries}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Maximum retry attempts exceeded. Database connection failed.');
};

const pool = createPool({
  create: createConnectionWithRetry,
  destroy: async (connection) => {
    await connection.end();
  },
  validate: (connection) => {
    return connection && connection.connection.state === 'authenticated';
  }
}, {
  max: 10, // Maximum number of connections in the pool
  min: 2, // Minimum number of connections in the pool
  acquireTimeoutMillis: 50000, // Time to wait before throwing an error when no connections are available
  idleTimeoutMillis: 50000, // Time after which idle connections in the pool will be closed
  evictionRunIntervalMillis: 4000, // Interval for eviction of idle connections
});

module.exports = { pool: pool };
