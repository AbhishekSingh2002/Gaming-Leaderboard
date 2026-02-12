# High Level Design (HLD) - Gaming Leaderboard System

## 1. System Overview

The Gaming Leaderboard System is a scalable, high-performance backend service that tracks player scores, calculates rankings, and provides real-time leaderboard data for multiplayer competitive games.

### 1.1 Business Requirements

- Support millions of concurrent users
- Real-time score submissions and ranking updates
- Fast leaderboard queries (top players)
- Individual player rank lookup
- Data consistency under high concurrency
- Low latency (<100ms for most operations)
- High availability (99.9% uptime)

### 1.2 Non-Functional Requirements

| Requirement | Target | Priority |
|------------|--------|----------|
| Scalability | 1M+ users, 5M+ sessions | High |
| Performance | <100ms API response (p95) | High |
| Availability | 99.9% uptime | High |
| Consistency | ACID transactions | Critical |
| Security | Rate limiting, input validation | High |
| Monitoring | Real-time metrics | Medium |

## 2. System Architecture

### 2.1 High-Level Components

```
┌───────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Web App   │  │  Mobile App │  │  Game Client│      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────┬───────────────────────────────┘
                            │ HTTPS/REST
                            ▼
┌───────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │              API Gateway / Load Balancer           │  │
│  │            (Rate Limiting, Authentication)         │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │           Express.js Application Server           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │
│  │  │Controller│  │ Service  │  │Repository│        │  │
│  │  └──────────┘  └──────────┘  └──────────┘        │  │
│  └────────────────────┬───────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Redis     │  │ PostgreSQL  │  │  New Relic  │
│   Cache     │  │  Database   │  │  Monitoring │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 2.2 Component Description

#### 2.2.1 API Gateway
- **Purpose**: Entry point for all client requests
- **Responsibilities**:
  - Request routing
  - Rate limiting
  - CORS handling
  - Authentication/Authorization
  - Request/Response transformation

#### 2.2.2 Application Server
- **Technology**: Node.js + Express.js
- **Architecture**: Layered (Controller → Service → Repository)
- **Responsibilities**:
  - Business logic execution
  - Data validation
  - Transaction management
  - Cache management
  - Error handling

#### 2.2.3 Cache Layer (Redis)
- **Purpose**: Reduce database load and improve response times
- **Cached Data**:
  - Top leaderboard (frequent reads)
  - Individual player ranks
- **Strategy**: Cache-aside with TTL
- **Invalidation**: On score submission

#### 2.2.4 Database (PostgreSQL)
- **Purpose**: Persistent data storage
- **Tables**:
  - `users`: Player information
  - `game_sessions`: Individual game records
  - `leaderboard`: Aggregated scores and ranks
- **Features**:
  - ACID transactions
  - Row-level locking
  - Indexes for performance

#### 2.2.5 Monitoring (New Relic)
- **Purpose**: Performance tracking and alerting
- **Metrics**:
  - API latency
  - Database query performance
  - Error rates
  - Cache hit rates
  - System resources

## 3. Data Flow

### 3.1 Score Submission Flow

```
┌──────┐     POST /submit      ┌─────────┐
│Client│─────────────────────►│   API   │
└──────┘                       └────┬────┘
                                    │
                          1. Validate input
                                    │
                                    ▼
                            ┌───────────────┐
                            │  Start Trans  │
                            └───────┬───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │Insert Session│ │Lock Row      │ │Update Score  │
            │   Record     │ │(FOR UPDATE)  │ │in Leaderboard│
            └──────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                            ┌───────▼────────┐
                            │ Commit Trans   │
                            └───────┬────────┘
                                    │
                            ┌───────▼────────┐
                            │Invalidate Cache│
                            └───────┬────────┘
                                    │
                            ┌───────▼────────┐
                            │Return Success  │
                            └────────────────┘
```

### 3.2 Leaderboard Fetch Flow

```
┌──────┐     GET /top         ┌─────────┐
│Client│─────────────────────►│   API   │
└──────┘                       └────┬────┘
                                    │
                            1. Check Redis
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                  Cache Hit                 Cache Miss
                       │                         │
                       ▼                         ▼
            ┌─────────────────┐        ┌──────────────┐
            │  Return Cached  │        │  Query DB    │
            │      Data       │        │              │
            └─────────────────┘        └──────┬───────┘
                                              │
                                       2. Store in cache
                                              │
                                       ┌──────▼───────┐
                                       │ Return Data  │
                                       └──────────────┘
```

### 3.3 Rank Lookup Flow

```
┌──────┐  GET /rank/:id      ┌─────────┐
│Client│─────────────────────►│   API   │
└──────┘                       └────┬────┘
                                    │
                         1. Check Cache
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                  Cache Hit                 Cache Miss
                       │                         │
                       ▼                         ▼
            ┌─────────────────┐    ┌──────────────────────┐
            │  Return Rank    │    │Query with ROW_NUMBER │
            │   from Cache    │    │   Window Function    │
            └─────────────────┘    └──────────┬───────────┘
                                              │
                                       2. Cache result
                                              │
                                       ┌──────▼───────┐
                                       │ Return Data  │
                                       └──────────────┘
```

## 4. Database Design

### 4.1 Schema Overview

```
┌─────────────────┐         ┌──────────────────────┐
│     users       │         │   game_sessions      │
├─────────────────┤         ├──────────────────────┤
│ id (PK)         │◄────┐   │ id (PK)              │
│ username        │     │   │ user_id (FK)         │
│ join_date       │     │   │ score                │
└─────────────────┘     │   │ game_mode            │
                        └───┤ timestamp            │
┌─────────────────┐         └──────────────────────┘
│  leaderboard    │         
├─────────────────┤         
│ id (PK)         │         
│ user_id (FK)    │◄────────users.id
│ total_score     │
│ rank            │
└─────────────────┘
```

### 4.2 Indexes

```sql
-- Critical for query performance
CREATE INDEX idx_leaderboard_total_score ON leaderboard(total_score DESC);
CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_timestamp ON game_sessions(timestamp DESC);
```

## 5. Scalability Considerations

### 5.1 Horizontal Scaling

- **Application Servers**: Stateless design allows multiple instances
- **Load Balancer**: Distribute traffic across servers
- **Database**: Read replicas for read-heavy operations

### 5.2 Vertical Scaling

- **Database**: Larger instance for write operations
- **Redis**: More memory for larger cache

### 5.3 Database Partitioning (Future)

- **Range Partitioning**: By user_id ranges
- **Time Partitioning**: Archive old game sessions
- **Sharding**: Distribute users across multiple databases

## 6. Security Considerations

### 6.1 API Security

- Rate limiting (1000 req/15min general, 60 req/min for submissions)
- Input validation and sanitization
- CORS configuration
- HTTPS enforcement

### 6.2 Database Security

- Parameterized queries (prevent SQL injection)
- Connection pooling with limits
- Encrypted connections
- Regular backups

### 6.3 Authentication (Future Enhancement)

- JWT tokens
- API keys
- OAuth2 integration

## 7. Monitoring and Observability

### 7.1 Metrics

- **Performance**: Response time, throughput
- **Errors**: Error rate, error types
- **Resources**: CPU, memory, disk
- **Business**: Active users, scores submitted

### 7.2 Alerts

- High error rate (>5%)
- Slow response time (>500ms p95)
- Database connection pool exhausted
- Cache hit rate below threshold (<70%)

### 7.3 Logging

- Structured logging (JSON format)
- Different log levels (info, warn, error)
- Correlation IDs for request tracing

## 8. Disaster Recovery

### 8.1 Backup Strategy

- **Database**: Daily full backups, hourly incrementals
- **Redis**: Persistence enabled (RDB + AOF)
- **Code**: Version control (Git)

### 8.2 Recovery Plan

- Database restore from backup
- Rebuild cache from database
- Replay recent transactions if needed

## 9. Future Enhancements

### 9.1 Phase 2 Features

- Multiple leaderboards (daily, weekly, monthly)
- Regional leaderboards
- Team-based rankings
- Historical data analytics

### 9.2 Technical Improvements

- GraphQL API
- WebSocket for real-time updates
- Microservices architecture
- Event-driven architecture (Kafka/RabbitMQ)

## 10. Cost Estimation

### 10.1 Infrastructure Costs (Monthly)

| Component | Specification | Cost |
|-----------|--------------|------|
| App Server | 2 instances (4 vCPU, 8GB RAM) | $150 |
| PostgreSQL | 16GB RAM, 500GB SSD | $200 |
| Redis | 8GB RAM | $50 |
| Load Balancer | Standard | $25 |
| New Relic | Free tier (100GB) | $0 |
| **Total** | | **$425/month** |

### 10.2 Scaling Costs

At 10x scale (10M users):
- Additional app servers: +$300
- Larger database: +$400
- More Redis: +$100
- **Estimated**: ~$1,200/month

---

**Document Version**: 1.0  
**Last Updated**: February 2025  
**Author**: Technical Team