-- Gaming Leaderboard System - Data Population Script
-- PostgreSQL 14+
-- This script populates the database with 1M users and 5M game sessions
-- CAUTION: This may take 5-15 minutes depending on hardware

-- Note: If this takes too long, reduce the numbers:
-- - For quick testing: 10,000 users, 50,000 sessions
-- - For medium testing: 100,000 users, 500,000 sessions
-- - For full testing: 1,000,000 users, 5,000,000 sessions

\timing on

BEGIN;

-- Step 1: Populate Users Table (1 Million Records)
-- Estimated time: 2-5 minutes
DO $$
BEGIN
    RAISE NOTICE 'Starting to populate users table with 1,000,000 records...';
END $$;

INSERT INTO users (username)
SELECT 'user_' || generate_series(1, 1000000);

DO $$
BEGIN
    RAISE NOTICE 'Users table populated successfully!';
    RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM users);
END $$;

COMMIT;

-- Step 2: Populate Game Sessions (5 Million Records)
-- Estimated time: 5-10 minutes
BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'Starting to populate game_sessions table with 5,000,000 records...';
    RAISE NOTICE 'This may take 5-10 minutes. Please wait...';
END $$;

INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
SELECT
    floor(random() * 1000000 + 1)::int,  -- Random user_id between 1 and 1,000,000
    floor(random() * 10000 + 1)::int,    -- Random score between 1 and 10,000
    CASE 
        WHEN random() > 0.5 THEN 'solo'
        ELSE 'team'
    END,
    NOW() - INTERVAL '1 day' * floor(random() * 365)  -- Random date within last year
FROM generate_series(1, 5000000);

DO $$
BEGIN
    RAISE NOTICE 'Game sessions table populated successfully!';
    RAISE NOTICE 'Total game sessions: %', (SELECT COUNT(*) FROM game_sessions);
END $$;

COMMIT;

-- Step 3: Populate Leaderboard by Aggregating Scores
-- Estimated time: 1-3 minutes
BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'Starting to populate leaderboard table...';
    RAISE NOTICE 'Aggregating scores from game_sessions...';
END $$;

INSERT INTO leaderboard (user_id, total_score, rank)
SELECT 
    user_id, 
    SUM(score)::BIGINT as total_score,
    ROW_NUMBER() OVER (ORDER BY SUM(score) DESC) as rank
FROM game_sessions
GROUP BY user_id;

DO $$
BEGIN
    RAISE NOTICE 'Leaderboard table populated successfully!';
    RAISE NOTICE 'Total leaderboard entries: %', (SELECT COUNT(*) FROM leaderboard);
END $$;

COMMIT;

-- Step 4: Analyze tables for query optimization
ANALYZE users;
ANALYZE game_sessions;
ANALYZE leaderboard;

-- Display statistics
DO $$
DECLARE
    user_count INT;
    session_count INT;
    leaderboard_count INT;
    top_player RECORD;
    avg_score NUMERIC;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO session_count FROM game_sessions;
    SELECT COUNT(*) INTO leaderboard_count FROM leaderboard;
    SELECT AVG(total_score) INTO avg_score FROM leaderboard;
    
    SELECT u.username, l.total_score 
    INTO top_player
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    ORDER BY l.total_score DESC
    LIMIT 1;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'DATABASE POPULATION COMPLETED!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Users: % records', user_count;
    RAISE NOTICE '  - Game Sessions: % records', session_count;
    RAISE NOTICE '  - Leaderboard: % records', leaderboard_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Statistics:';
    RAISE NOTICE '  - Average score: %', ROUND(avg_score, 2);
    RAISE NOTICE '  - Top player: % with score %', top_player.username, top_player.total_score;
    RAISE NOTICE '================================================';
    RAISE NOTICE 'The system is ready for testing!';
    RAISE NOTICE 'Start the application with: npm start';
END $$;

-- Quick verification queries
\echo '\n=== Quick Verification ===\n'

\echo 'Top 5 Players:'
SELECT 
    u.username,
    l.total_score,
    l.rank
FROM leaderboard l
JOIN users u ON l.user_id = u.id
ORDER BY l.total_score DESC
LIMIT 5;

\echo '\n'
\echo 'Game Mode Distribution:'
SELECT 
    game_mode,
    COUNT(*) as session_count,
    ROUND(AVG(score), 2) as avg_score
FROM game_sessions
GROUP BY game_mode;

\echo '\n'
\echo 'Database Sizes:'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\timing off