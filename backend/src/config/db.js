// Use mock database for testing
// const { Pool } = require('pg');
// require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Debug: Check if environment variables are loaded
console.log(' DB Config:', {
  host: process.env.DB_HOST || 'mock',
  port: process.env.DB_PORT || 'mock',
  user: process.env.DB_USER || 'mock',
  database: process.env.DB_NAME || 'mock',
  password: process.env.DB_PASSWORD ? '***' : 'mock'
});

// Create mock connection pool for testing
const mockPool = require('./db-mock');
module.exports = mockPool;