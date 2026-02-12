// Load New Relic first (before any other require statements)
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('./config/newrelic');
  require('newrelic');
}

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./app');
const leaderboardService = require('./services/leaderboard.service');

const PORT = process.env.PORT || 8000;

/**
 * Start Server
 */
async function startServer() {
  try {
    // Initialize database indexes
    console.log('🔧 Initializing database...');
    await leaderboardService.initializeDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Gaming Leaderboard API is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   POST   /api/leaderboard/submit`);
      console.log(`   GET    /api/leaderboard/top`);
      console.log(`   GET    /api/leaderboard/rank/:user_id\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();