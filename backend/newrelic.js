/**
 * New Relic configuration for Gaming Leaderboard API
 * This file should be required at the very top of your application
 */

// Initialize New Relic if license key is available
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
  console.log('📊 New Relic monitoring initialized');
} else {
  console.log('⚠️  New Relic license key not found - monitoring disabled');
}
