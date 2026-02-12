# Low Level Design (LLD) - Gaming Leaderboard System

## 1. Application Architecture

### 1.1 Layered Architecture Pattern

The application follows a clean, layered architecture:

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                 │
│  ├── Routes (Express Router)                    │
│  └── Controllers (Request/Response handling)    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Business Logic Layer               │
│  └── Services (Business rules, validation)      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Data Access Layer                  │
│  └── Repositories (Database queries)            │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Infrastructure Layer               │
│  ├── Database (PostgreSQL)                      │
│  ├── Cache (Redis)                              │
│  └── Monitoring (New Relic)                     │
└─────────────────────────────────────────────────┘
```

## 2. Code Structure

### 2.1 Directory Organization

```
backend/
├── src/
│   ├── app.js                     # Express app configuration
│   ├── server.js                  # Server entry point
│   ├── config/
│   │   ├── db.js                  # PostgreSQL connection pool
│   │   ├── redis.js               # Redis client & cache service
│   │   └── newrelic.js            # New Relic configuration
│   ├── routes/
│   │   └── leaderboard.routes.js  # API route definitions
│   ├── controllers/
│   │   └── leaderboard.controller.js  # Request handlers
│   ├── services/
│   │   └── leaderboard.service.js     # Business logic
│   ├── repositories/
│   │   └── leaderboard.repo.js        # Database operations
│   ├── middlewares/
│   │   ├── error.middleware.js        # Error handling
│   │   └── rateLimit.middleware.js    # Rate limiting
│   ├── utils/
│   │   └── transactions.js            # Transaction helpers
│   └── tests/
│       └── leaderboard.test.js        # Unit tests
└── package.json
```

## 3. Detailed Component Design

### 3.1 Database Configuration

**File**: `config/db.js`

```javascript
Purpose: Manage PostgreSQL connection pool

Key Features:
- Connection pooling (max 20 connections)
- Automatic reconnection
- Error handling
- Connection health monitoring

Configuration:
{
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // 30 seconds
  connectionTimeoutMillis: 2000  // 2 seconds
}
```

### 3.2 Cache Service

**File**: `config/redis.js`

```javascript
Purpose: Redis client management and caching utilities

Methods:
1. get(key)
   - Retrieves cached data
   - Returns null if not found
   - Auto-parses JSON

2. set(key, value, ttl)
   - Stores data with expiration
   - Default TTL: 60 seconds
   - Auto-stringifies JSON

3. del(key)
   - Removes specific key
   
4. delPattern(pattern)
   - Removes keys matching pattern
   - Used for cache invalidation

Cache Keys Design:
- leaderboard:top:{limit}      # Top players list
- leaderboard:rank:{user_id}   # Individual rank
```

### 3.3 Transaction Utility

**File**: `utils/transactions.js`

```javascript
Purpose: Manage database transactions for atomicity

Function: withTransaction(callback)

Flow:
1. Acquire client from pool
2. BEGIN transaction
3. Execute callback with client
4. COMMIT on success
5. ROLLBACK on error
6. Release client to pool

Usage Pattern:
await withTransaction(async (client) => {
  // All operations use same client
  await operation1(client);
  await operation2(client);
  // Automatic commit or rollback
});
```

### 3.4 Repository Layer

**File**: `repositories/leaderboard.repo.js`

#### 3.4.1 Insert Game Session

```sql
INSERT INTO game_sessions (user_id, score, game_mode)
VALUES ($1, $2, $3)
RETURNING id, user_id, score, game_mode, timestamp
```

**Purpose**: Record each game played  
**Complexity**: O(1)  
**Index Used**: None (sequential insert)

#### 3.4.2 Update Leaderboard Score

```sql
-- Step 1: Check existence with lock
SELECT id, user_id, total_score
FROM leaderboard
WHERE user_id = $1
FOR UPDATE;

-- Step 2a: Insert new record (if not exists)
INSERT INTO leaderboard (user_id, total_score)
VALUES ($1, $2);

-- Step 2b: Update existing record (if exists)
UPDATE leaderboard
SET total_score = total_score + $1
WHERE user_id = $2;
```

**Purpose**: Atomically update total score  
**Complexity**: O(1) with index  
**Lock**: Row-level lock prevents race conditions  
**Index Used**: `idx_leaderboard_user_id`

#### 3.4.3 Get Top Players

```sql
SELECT 
  l.user_id,
  u.username,
  l.total_score,
  ROW_NUMBER() OVER (ORDER BY l.total_score DESC) as rank
FROM leaderboard l
JOIN users u ON l.user_id = u.id
ORDER BY l.total_score DESC
LIMIT $1;
```

**Purpose**: Fetch top N players  
**Complexity**: O(N) where N = limit  
**Index Used**: `idx_leaderboard_total_score DESC`  
**Window Function**: ROW_NUMBER() for efficient ranking

#### 3.4.4 Get Player Rank

```sql
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
WHERE rp.user_id = $1;
```

**Purpose**: Get specific user's rank  
**Complexity**: O(N log N) for ranking, O(1) for lookup  
**Optimization**: Can be optimized with COUNT() for large datasets  
**Index Used**: `idx_leaderboard_total_score DESC`

### 3.5 Service Layer

**File**: `services/leaderboard.service.js`

#### 3.5.1 Submit Score

```javascript
async submitScore(userId, score, gameMode)

Validation:
- userId must be a positive integer
- score must be a positive integer
- User must exist in database

Transaction Steps:
1. Start transaction
2. Insert into game_sessions
3. Lock leaderboard row
4. Update total_score
5. Commit transaction
6. Invalidate cache

Error Handling:
- User not found → 404
- Invalid input → 400
- Transaction failure → 500, rollback
```

#### 3.5.2 Get Top Players

```javascript
async getTopPlayers(limit = 10)

Cache Strategy:
1. Check Redis for key: leaderboard:top:{limit}
2. If found → Return cached data (cache hit)
3. If not found → Query database
4. Store in cache with 60s TTL
5. Return data

Response Includes:
- Data source (cache or database)
- Array of top players
```

#### 3.5.3 Get Player Rank

```javascript
async getPlayerRank(userId)

Cache Strategy:
1. Check Redis for key: leaderboard:rank:{userId}
2. If found → Return cached data
3. If not found → Query database with ranking
4. Store in cache
5. Return data

Error Handling:
- Invalid userId → 400
- User not found → 404
```

#### 3.5.4 Cache Invalidation

```javascript
async invalidateCache(userId = null)

Strategy:
1. Delete all top leaderboard caches (pattern: leaderboard:top:*)
2. If userId provided, delete specific rank cache

Reason:
- Score submission changes rankings
- Must invalidate to maintain consistency
```

### 3.6 Controller Layer

**File**: `controllers/leaderboard.controller.js`

#### Responsibilities

1. **Request Parsing**
   - Extract parameters from req.body, req.params, req.query
   - Type conversion (string to integer)

2. **Validation**
   - Check for required fields
   - Validate data types
   - Validate ranges

3. **Service Invocation**
   - Call appropriate service methods
   - Pass validated parameters

4. **Response Formatting**
   - Success responses (200)
   - Error responses (400, 404, 500)
   - Consistent JSON structure

5. **Error Handling**
   - Catch exceptions
   - Map to appropriate HTTP status codes
   - Log errors

### 3.7 Middleware

#### 3.7.1 Rate Limiting

**File**: `middlewares/rateLimit.middleware.js`

```javascript
Configuration:

1. General API Limiter:
   - Window: 15 minutes
   - Max requests: 1000 per IP
   - Applies to: All /api routes

2. Submit Score Limiter:
   - Window: 1 minute
   - Max requests: 60 per IP
   - Applies to: POST /api/leaderboard/submit

Implementation:
- Uses express-rate-limit
- In-memory store (can be Redis for distributed)
- Standard headers included
```

#### 3.7.2 Error Handling

**File**: `middlewares/error.middleware.js`

```javascript
Two Handlers:

1. notFoundHandler()
   - Catches 404 errors
   - Returns JSON response

2. errorHandler(err, req, res, next)
   - Global error catcher
   - Logs errors
   - Returns appropriate status code
   - Includes stack trace in development
```

## 4. API Design Details

### 4.1 Request/Response Format

#### Standard Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* payload */ },
  "source": "cache" | "database"  // Optional
}
```

#### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace"  // Only in development
}
```

### 4.2 Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful operation |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## 5. Performance Optimization Strategies

### 5.1 Database Optimization

#### Indexing Strategy

```sql
-- Primary indexes (created automatically)
PRIMARY KEY on id columns

-- Performance indexes
CREATE INDEX idx_leaderboard_total_score ON leaderboard(total_score DESC);
-- Why: Speeds up ORDER BY total_score DESC
-- Benefit: Query time from O(N log N) to O(N)

CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
-- Why: Speeds up WHERE user_id = X lookups
-- Benefit: Query time from O(N) to O(log N)

CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
-- Why: Speeds up JOIN operations
-- Benefit: JOIN time from O(N*M) to O(N log M)
```

#### Query Optimization

1. **Use Window Functions**
   - `ROW_NUMBER() OVER (ORDER BY total_score DESC)`
   - More efficient than subqueries
   - Single pass through data

2. **Limit Result Sets**
   - Always use LIMIT for pagination
   - Never fetch entire table

3. **Proper JOINs**
   - Use INNER JOIN when possible
   - Ensure JOIN columns are indexed

### 5.2 Caching Strategy

#### When to Cache

✅ **DO Cache:**
- Top leaderboard (read >> write)
- Individual player ranks
- Frequently accessed data

❌ **DON'T Cache:**
- Write operations
- User-specific data (unless high traffic)
- Real-time requirements

#### Cache TTL Decision

```
Cache TTL = f(update_frequency, consistency_requirement)

High update frequency + Low consistency = Shorter TTL (30-60s)
Low update frequency + High consistency = Longer TTL (5-10min)

Our choice: 60 seconds
Reason: Good balance for gaming leaderboard
```

#### Cache Invalidation

```
Write-through strategy:
1. Update database
2. Invalidate cache
3. Next read will populate cache

Benefits:
- Always consistent after write
- Simple to implement
- Predictable behavior
```

### 5.3 Concurrency Control

#### Problem: Race Conditions

```
Scenario:
- User submits two scores simultaneously
- Both read current_score = 100
- Both write current_score = 100 + new_score
- Result: One score is lost

Solution: Row-level locking
```

#### Implementation

```sql
BEGIN;
SELECT total_score FROM leaderboard WHERE user_id = $1 FOR UPDATE;
-- Row is now locked
UPDATE leaderboard SET total_score = total_score + $2 WHERE user_id = $1;
COMMIT;
-- Lock released
```

**How it works:**
1. FOR UPDATE acquires exclusive lock
2. Other transactions wait
3. Updates happen sequentially
4. No lost updates

**Performance Impact:**
- Slight delay when concurrent
- Better than incorrect data
- Acceptable for leaderboards

## 6. Error Handling Strategy

### 6.1 Error Classification

| Type | HTTP Code | Action |
|------|-----------|--------|
| Validation Error | 400 | Return error message |
| Not Found | 404 | Check existence first |
| Rate Limit | 429 | Apply backoff |
| Server Error | 500 | Log and alert |

### 6.2 Error Propagation

```
Repository → Service → Controller

Each layer:
1. Catches errors from below
2. Adds context
3. Decides to handle or propagate
4. Controller always handles
```

### 6.3 Logging

```javascript
Levels:
- info: Normal operations
- warn: Unusual but handled
- error: Failures requiring attention

Format:
{
  level: "error",
  message: "Operation failed",
  userId: 123,
  timestamp: "2025-02-12T10:30:00Z",
  stack: "..."
}
```

## 7. Testing Strategy

### 7.1 Unit Tests

**File**: `tests/leaderboard.test.js`

```javascript
Test Coverage:

1. API Endpoints
   - Valid requests
   - Invalid requests
   - Edge cases

2. Service Layer
   - Business logic
   - Validation
   - Error handling

3. Repository Layer
   - Database operations
   - Transaction handling
   - Query correctness
```

### 7.2 Integration Tests

```
Test Scenarios:
1. End-to-end score submission
2. Concurrent submissions (race conditions)
3. Cache behavior (hit/miss)
4. Error recovery
```

### 7.3 Load Testing

**File**: `scripts/load-test.py`

```
Metrics Tracked:
- Response time (average, median, p95, p99)
- Success rate
- Error rate
- Cache hit rate
- Database query time
```

## 8. Deployment Considerations

### 8.1 Environment Variables

```bash
# Required
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
REDIS_HOST, REDIS_PORT

# Optional
NEW_RELIC_LICENSE_KEY
CACHE_TTL
PORT
NODE_ENV
```

### 8.2 Process Management

```bash
# Development
npm run dev  # nodemon for auto-restart

# Production
pm2 start src/server.js --name gaming-leaderboard
pm2 startup  # Auto-start on boot
pm2 save     # Save process list
```

### 8.3 Health Checks

```javascript
Endpoint: GET /api/health

Checks:
1. Application running
2. Database connection
3. Redis connection
4. Response time

Use for:
- Load balancer health checks
- Monitoring systems
- Auto-scaling decisions
```

## 9. Monitoring and Observability

### 9.1 New Relic Integration

```javascript
Automatic Tracking:
- API endpoint performance
- Database query time
- External service calls
- Error rates

Custom Metrics:
- Cache hit rate
- Leaderboard updates per minute
- Active users
```

### 9.2 Alert Configuration

```
Alerts:
1. API latency > 500ms (p95) for 5 minutes
2. Error rate > 5% for 1 minute
3. Database connection pool > 90% for 5 minutes
4. Cache hit rate < 70% for 10 minutes
```

## 10. Future Enhancements

### 10.1 Code Level

1. **GraphQL API**
   - More flexible queries
   - Reduce over-fetching

2. **WebSocket Support**
   - Real-time leaderboard updates
   - Push notifications

3. **Microservices**
   - Separate services for different game modes
   - Independent scaling

### 10.2 Data Level

1. **Time-based Leaderboards**
   - Daily, weekly, monthly
   - Automated archival

2. **Regional Leaderboards**
   - Geo-based sharding
   - Reduced latency

3. **Historical Analytics**
   - Player progress tracking
   - Trend analysis

---

**Document Version**: 1.0  
**Last Updated**: February 2025  
**Author**: Technical Team