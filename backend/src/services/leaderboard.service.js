const leaderboardRepo = require('../repositories/leaderboard.repo');
const { withTransaction } = require('../utils/transactions');
const { cacheService } = require('../config/redis');

/**
 * Leaderboard Service
 * Contains business logic for leaderboard operations
 * Handles caching, transactions, and data validation
 */
class LeaderboardService {
  
  /**
   * Submit a new score for a player
   * Uses transactions to ensure atomicity
   * Invalidates cache after successful submission
   * 
   * @param {Number} userId - User ID
   * @param {Number} score - Game score
   * @param {String} gameMode - Game mode (optional)
   * @returns {Object} - Submission result
   */
  async submitScore(userId, score, gameMode = 'solo') {
    // Validate inputs
    if (!userId || typeof userId !== 'number') {
      throw new Error('Invalid user_id');
    }
    
    if (!score || typeof score !== 'number' || score < 0) {
      throw new Error('Invalid score');
    }

    // Check if user exists
    const userExists = await leaderboardRepo.userExists(userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Execute within transaction to ensure atomicity
    const result = await withTransaction(async (client) => {
      // Insert game session
      const gameSession = await leaderboardRepo.insertGameSession(
        client,
        userId,
        score,
        gameMode
      );

      // Update leaderboard total score
      const leaderboardUpdate = await leaderboardRepo.updateLeaderboardScore(
        client,
        userId,
        score
      );

      return {
        gameSession,
        leaderboard: leaderboardUpdate
      };
    });

    // Invalidate relevant caches
    await this.invalidateCache(userId);

    return {
      success: true,
      message: 'Score submitted successfully',
      data: result
    };
  }

  /**
   * Get top N players from leaderboard
   * Uses caching to improve performance
   * 
   * @param {Number} limit - Number of top players
   * @returns {Array} - Top players
   */
  async getTopPlayers(limit = 10) {
    const cacheKey = `leaderboard:top:${limit}`;
    
    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return {
        success: true,
        source: 'cache',
        data: cachedData
      };
    }

    // Fetch from database
    const topPlayers = await leaderboardRepo.getTopPlayers(limit);

    // Store in cache
    await cacheService.set(cacheKey, topPlayers);

    return {
      success: true,
      source: 'database',
      data: topPlayers
    };
  }

  /**
   * Get player's rank and score
   * Uses caching with user-specific key
   * 
   * @param {Number} userId - User ID
   * @returns {Object} - Player rank information
   */
  async getPlayerRank(userId) {
    // Validate input
    if (!userId || typeof userId !== 'number') {
      throw new Error('Invalid user_id');
    }

    const cacheKey = `leaderboard:rank:${userId}`;
    
    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return {
        success: true,
        source: 'cache',
        data: cachedData
      };
    }

    // Fetch from database
    const playerRank = await leaderboardRepo.getPlayerRank(userId);

    if (!playerRank) {
      throw new Error('Player not found in leaderboard');
    }

    // Store in cache
    await cacheService.set(cacheKey, playerRank);

    return {
      success: true,
      source: 'database',
      data: playerRank
    };
  }

  /**
   * Invalidate cache when leaderboard changes
   * Removes top players cache and specific user rank cache
   * 
   * @param {Number} userId - User ID (optional)
   */
  async invalidateCache(userId = null) {
    try {
      // Invalidate top players cache
      await cacheService.delPattern('leaderboard:top:*');
      
      // Invalidate specific user rank cache
      if (userId) {
        await cacheService.del(`leaderboard:rank:${userId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Initialize database indexes for performance
   */
  async initializeDatabase() {
    try {
      await leaderboardRepo.createIndexes();
      console.log('✅ Database initialized with indexes');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
}

module.exports = new LeaderboardService();