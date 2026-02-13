const express = require('express');
const cors = require('cors');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const leaderboardController = require('./controllers/leaderboard.controller');
const { apiLimiter, submitScoreLimiter } = require('./middlewares/rateLimit.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

/**
 * Express Application Setup
 */
const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', leaderboardController.healthCheck.bind(leaderboardController));

// Leaderboard routes with specific rate limiting for submit
app.use('/api/leaderboard', leaderboardRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;