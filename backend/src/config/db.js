// Use real PostgreSQL database
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Debug: Check if environment variables are loaded
console.log(' DB Config:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  database: process.env.DB_NAME || 'gaming_leaderboard',
  password: process.env.DB_PASSWORD ? '***' : 'not set'
});

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  database: process.env.DB_NAME || 'gaming_leaderboard',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;