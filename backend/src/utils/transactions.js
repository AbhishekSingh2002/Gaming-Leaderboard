const pool = require('../config/db');

/**
 * Execute database operations within a transaction
 * Ensures atomicity and consistency for concurrent operations
 * 
 * @param {Function} callback - Async function that performs database operations
 * @returns {Promise} - Result of the transaction
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute the callback with the client
    const result = await callback(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

/**
 * Execute a query with row-level locking
 * Prevents race conditions during concurrent updates
 * 
 * @param {Object} client - Database client
 * @param {String} query - SQL query with FOR UPDATE
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
async function queryWithLock(client, query, params) {
  return await client.query(query, params);
}

module.exports = {
  withTransaction,
  queryWithLock
};