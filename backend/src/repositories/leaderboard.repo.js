const pool = require('../config/db');

/**
 * Leaderboard Repository
 * Handles all database operations for the leaderboard system
 * Includes optimized queries with indexing support
 */
class LeaderboardRepository {
  
  /**
   * Insert a new game session
   * @param {Object} client - Database client (for transactions)
   * @param {Number} userId - User ID
   * @param {Number} score - Game score
   * @param {String} gameMode - Game mode (solo/team)
   */
  async insertGameSession(client, userId, score, gameMode = 'solo') {
    const query = `
      INSERT INTO game_sessions (user_id, score, game_mode)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, score, game_mode, timestamp
    `;
    
    const result = await client.query(query, [userId, score, gameMode]);
    return result.rows[0];
  }

  /**
   * Update leaderboard total score atomically
   * Uses row-level locking to prevent race conditions
   * @param {Object} client - Database client (for transactions)
   * @param {Number} userId - User ID
   * @param {Number} score - Score to add
   */
  async updateLeaderboardScore(client, userId, score) {
    // Check if user exists in leaderboard with row lock
    const checkQuery = `
      SELECT id, user_id, total_score
      FROM leaderboard
      WHERE user_id = $1
      FOR UPDATE
    `;
    
    const checkResult = await client.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      // Insert new record
      const insertQuery = `
        INSERT INTO leaderboard (user_id, total_score)
        VALUES ($1, $2)
        RETURNING id, user_id, total_score
      `;
      const result = await client.query(insertQuery, [userId, score]);
      return result.rows[0];
    } else {
      // Update existing record
      const updateQuery = `
        UPDATE leaderboard
        SET total_score = total_score + $1
        WHERE user_id = $2
        RETURNING id, user_id, total_score
      `;
      const result = await client.query(updateQuery, [score, userId]);
      return result.rows[0];
    }
  }

  /**
   * Get top N players from leaderboard
   * Optimized with index on total_score
   * @param {Number} limit - Number of top players to fetch
   */
  async getTopPlayers(limit = 10) {
    const query = `
      SELECT 
        l.user_id,
        u.username,
        l.total_score,
        ROW_NUMBER() OVER (ORDER BY l.total_score DESC) as rank
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.total_score DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get player's rank by user_id
   * Uses efficient ranking calculation
   * @param {Number} userId - User ID
   */
  async getPlayerRank(userId) {
    const query = `
      WITH ranked_players AS (
        SELECT 
          user_id,
          total_score,
          ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
        FROM leaderboard
      )
      SELECT 
        rp.user_id,
        u.username,
        rp.total_score,
        rp.rank
      FROM ranked_players rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Check if user exists
   * @param {Number} userId - User ID
   */
  async userExists(userId) {
    const query = 'SELECT id FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0;
  }

  /**
   * Get user by ID
   * @param {Number} userId - User ID
   */
  async getUserById(userId) {
    const query = 'SELECT id, username, join_date FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Create database indexes for performance optimization
   * Run this once during setup
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC)',
      'CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_timestamp ON game_sessions(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log(`✅ Index created: ${indexQuery.split('idx_')[1]?.split(' ')[0]}`);
      } catch (error) {
        console.error(`❌ Error creating index:`, error.message);
      }
    }
  }
}

module.exports = new LeaderboardRepository();