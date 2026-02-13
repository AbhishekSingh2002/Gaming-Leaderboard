const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');
const { submitScoreLimiter } = require('../middlewares/rateLimit.middleware');

/**
 * Leaderboard Routes
 * All endpoints are prefixed with /api/leaderboard
 */

// Submit score with rate limiting
router.post('/submit', submitScoreLimiter, leaderboardController.submitScore.bind(leaderboardController));

// Get top players
router.get('/top', leaderboardController.getTopPlayers.bind(leaderboardController));

// Get player rank
router.get('/rank/:user_id', leaderboardController.getPlayerRank.bind(leaderboardController));

module.exports = router;