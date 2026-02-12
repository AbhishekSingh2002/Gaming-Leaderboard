-- Gaming Leaderboard System - Database Schema
-- PostgreSQL 14+

-- Drop existing tables if they exist (development only)
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_sessions table
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0),
    game_mode VARCHAR(50) NOT NULL DEFAULT 'solo',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leaderboard table
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_score BIGINT NOT NULL DEFAULT 0 CHECK (total_score >= 0),
    rank INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
-- These indexes are critical for query performance with millions of records

-- Leaderboard indexes
CREATE INDEX idx_leaderboard_total_score ON leaderboard(total_score DESC);
-- Purpose: Speeds up ORDER BY total_score DESC queries for top players
-- Impact: Reduces query time from O(N log N) to O(N) for top N queries

CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
-- Purpose: Speeds up user-specific lookups
-- Impact: Reduces lookup time from O(N) to O(log N)

-- Game sessions indexes
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
-- Purpose: Speeds up aggregation queries by user_id
-- Impact: Improves JOIN performance and user history queries

CREATE INDEX idx_game_sessions_timestamp ON game_sessions(timestamp DESC);
-- Purpose: Enables fast recent games queries
-- Impact: Useful for time-based analytics

-- Users table index
CREATE INDEX idx_users_username ON users(username);
-- Purpose: Speeds up username lookups and searches
-- Impact: O(log N) lookup time

-- Create updated_at trigger function for leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to leaderboard table
CREATE TRIGGER trigger_update_leaderboard_timestamp
BEFORE UPDATE ON leaderboard
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_timestamp();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores player information and profile data';
COMMENT ON TABLE game_sessions IS 'Records each individual game session played';
COMMENT ON TABLE leaderboard IS 'Maintains aggregated scores and rankings for all players';

COMMENT ON COLUMN users.username IS 'Unique player username';
COMMENT ON COLUMN users.join_date IS 'Date when player joined the platform';

COMMENT ON COLUMN game_sessions.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN game_sessions.score IS 'Score achieved in this game session';
COMMENT ON COLUMN game_sessions.game_mode IS 'Type of game played (solo, team, etc.)';

COMMENT ON COLUMN leaderboard.user_id IS 'Foreign key reference to users table (unique)';
COMMENT ON COLUMN leaderboard.total_score IS 'Cumulative score across all game sessions';
COMMENT ON COLUMN leaderboard.rank IS 'Current ranking position (can be computed)';
COMMENT ON COLUMN leaderboard.last_updated IS 'Timestamp of last score update';

-- Create a view for quick leaderboard access with rankings
CREATE OR REPLACE VIEW v_leaderboard_ranked AS
SELECT 
    l.id,
    l.user_id,
    u.username,
    l.total_score,
    ROW_NUMBER() OVER (ORDER BY l.total_score DESC) as rank,
    l.last_updated,
    u.join_date
FROM leaderboard l
JOIN users u ON l.user_id = u.id
ORDER BY l.total_score DESC;

COMMENT ON VIEW v_leaderboard_ranked IS 'Materialized view of leaderboard with computed rankings';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO gaming_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gaming_app_user;

-- Display schema information
DO $$
BEGIN
    RAISE NOTICE 'Gaming Leaderboard Schema Created Successfully!';
    RAISE NOTICE 'Tables: users, game_sessions, leaderboard';
    RAISE NOTICE 'Indexes: 5 performance indexes created';
    RAISE NOTICE 'Views: v_leaderboard_ranked';
    RAISE NOTICE 'Next step: Run populate_data.sql to insert test data';
END $$;