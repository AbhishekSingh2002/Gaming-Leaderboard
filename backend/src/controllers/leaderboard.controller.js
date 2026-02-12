const leaderboardService = require('../services/leaderboard.service');

/**
 * Leaderboard Controller
 * Handles HTTP requests and responses for leaderboard endpoints
 */
class LeaderboardController {
  
  /**
   * Submit a score
   * POST /api/leaderboard/submit
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async submitScore(req, res) {
    try {
      const { user_id, score, game_mode } = req.body;

      // Validate request body
      if (!user_id || !score) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: user_id and score'
        });
      }

      // Call service
      const result = await leaderboardService.submitScore(
        parseInt(user_id),
        parseInt(score),
        game_mode || 'solo'
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Submit score error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit score'
      });
    }
  }

  /**
   * Get top players
   * GET /api/leaderboard/top
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTopPlayers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      // Validate limit
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100'
        });
      }

      // Call service
      const result = await leaderboardService.getTopPlayers(limit);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get top players error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch top players'
      });
    }
  }

  /**
   * Get player rank
   * GET /api/leaderboard/rank/:user_id
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPlayerRank(req, res) {
    try {
      const userId = parseInt(req.params.user_id);

      // Validate user_id
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user_id'
        });
      }

      // Call service
      const result = await leaderboardService.getPlayerRank(userId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get player rank error:', error);
      
      if (error.message === 'Player not found in leaderboard') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch player rank'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/health
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Gaming Leaderboard API is running',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new LeaderboardController();