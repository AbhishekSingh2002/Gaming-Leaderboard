# 🎮 Gaming Leaderboard System

A high-performance, scalable gaming leaderboard system that handles millions of users with real-time ranking, optimized database queries, caching, and monitoring.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D14.0-blue.svg)](https://www.postgresql.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

This project demonstrates a **production-ready gaming leaderboard system** that:

- Handles **1 million+ users** and **5 million+ game sessions**
- Provides **low-latency APIs** (< 100ms response time)
- Ensures **data consistency** under concurrent operations
- Uses **caching** for optimal performance
- Includes **real-time monitoring** with New Relic
- Features a **live-updating frontend** interface

### Problem Statement

Modern gaming platforms face unique challenges:
- Millions of concurrent players submitting scores
- Need for accurate, real-time rankings
- High-frequency read operations
- Race conditions during concurrent updates
- Performance degradation with large datasets

### Solution

This system solves these challenges through:
- **Atomic transactions** for data consistency
- **Database indexing** for fast queries
- **Redis caching** to reduce database load
- **Optimized SQL queries** with proper joins
- **Rate limiting** to prevent abuse
- **Monitoring** to identify bottlenecks

## ✨ Features

### Core Functionality
- ✅ Score submission with automatic ranking updates
- ✅ Top 10 leaderboard with live updates
- ✅ Individual player rank lookup
- ✅ Real-time data synchronization

### Technical Excellence
- 🚀 **High Performance**: Sub-100ms API response times
- 🔒 **Atomic Operations**: Transaction-based score updates
- 📊 **Scalable**: Handles millions of records efficiently
- ⚡ **Caching**: Redis integration for faster reads
- 📈 **Monitoring**: New Relic performance tracking
- 🔐 **Security**: Rate limiting and input validation
- 🧪 **Tested**: Comprehensive unit and integration tests

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: PostgreSQL (v14+)
- **Cache**: Redis (v7+)
- **Monitoring**: New Relic
- **Testing**: Jest, Supertest

### Frontend
- **Library**: React (v18+)
- **HTTP Client**: Axios
- **Styling**: CSS3 with animations

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Load Testing**: Python (requests library)

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐      ┌─────────────┐
│   Express   │◄────►│   Redis     │
│   Backend   │      │   Cache     │
└──────┬──────┘      └─────────────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│ PostgreSQL  │      │  New Relic  │
│  Database   │      │  Monitoring │
└─────────────┘      └─────────────┘
```

### Data Flow

1. **Score Submission**:
   ```
   Client → API → Transaction Start → Insert game_sessions
   → Update leaderboard → Transaction Commit → Invalidate Cache
   ```

2. **Leaderboard Fetch**:
   ```
   Client → API → Check Cache → If Miss: Query DB → Update Cache → Return Data
   ```

3. **Rank Lookup**:
   ```
   Client → API → Check Cache → If Miss: Query DB with Ranking → Cache Result → Return Data
   ```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- Redis (v7 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gaming-leaderboard.git
   cd gaming-leaderboard
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb gaming_leaderboard
   
   # Run schema
   psql gaming_leaderboard < schema.sql
   
   # Populate with test data (1M users, 5M sessions)
   psql gaming_leaderboard < populate_data.sql
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start Redis**
   ```bash
   redis-server
   ```

### Running the Application

1. **Start Backend**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:8000
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   # Opens browser at http://localhost:3000
   ```

3. **Run Load Test**
   ```bash
   cd scripts
   python3 load-test.py
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### 1. Submit Score
```http
POST /leaderboard/submit
```

**Request Body:**
```json
{
  "user_id": 123,
  "score": 5000,
  "game_mode": "solo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Score submitted successfully",
  "data": {
    "gameSession": {
      "id": 567,
      "user_id": 123,
      "score": 5000,
      "game_mode": "solo"
    },
    "leaderboard": {
      "user_id": 123,
      "total_score": 15000
    }
  }
}
```

#### 2. Get Top Players
```http
GET /leaderboard/top?limit=10
```

**Response:**
```json
{
  "success": true,
  "source": "cache",
  "data": [
    {
      "user_id": 42,
      "username": "user_42",
      "total_score": 95234,
      "rank": 1
    }
  ]
}
```

#### 3. Get Player Rank
```http
GET /leaderboard/rank/:user_id
```

**Response:**
```json
{
  "success": true,
  "source": "database",
  "data": {
    "user_id": 123,
    "username": "user_123",
    "total_score": 15000,
    "rank": 4567
  }
}
```

#### 4. Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Gaming Leaderboard API is running",
  "timestamp": "2025-02-12T10:30:00.000Z"
}
```

## ⚡ Performance Optimization

### Database Optimization

1. **Indexes Created**
   ```sql
   CREATE INDEX idx_leaderboard_total_score ON leaderboard(total_score DESC);
   CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
   CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
   ```

2. **Query Optimization**
   - Using `ROW_NUMBER()` window function for ranking
   - Aggregation table (`leaderboard`) to avoid repeated calculations
   - Proper JOIN operations with indexed columns

3. **Transaction Management**
   - Row-level locking with `FOR UPDATE`
   - Atomic score updates
   - Proper error handling and rollback

### Caching Strategy

1. **Cache Keys**
   - `leaderboard:top:{limit}` - Top players list
   - `leaderboard:rank:{user_id}` - Individual player rank

2. **Cache Invalidation**
   - On score submission: Clear top leaderboard + specific user rank
   - Pattern-based deletion for efficiency

3. **TTL Settings**
   - Default: 60 seconds
   - Adjustable based on traffic patterns

### Concurrency Handling

```javascript
// Transaction with row-level locking
await withTransaction(async (client) => {
  // Lock the row
  await client.query('SELECT ... FOR UPDATE');
  
  // Perform updates
  await updateLeaderboard(client, userId, score);
  
  // Commit happens automatically
});
```

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
npm test
```

### Run Load Tests
```bash
cd scripts
python3 load-test.py

# Choose mode:
# 1. Continuous simulation
# 2. Load test (60 seconds)
# 3. Heavy load test (5 minutes)
```

### Test Coverage
- ✅ API endpoint validation
- ✅ Database operations
- ✅ Caching behavior
- ✅ Error handling
- ✅ Concurrency scenarios

## 📊 Monitoring with New Relic

### Setup

1. Sign up for New Relic (100GB free tier)
2. Get your license key
3. Add to `.env`:
   ```
   NEW_RELIC_LICENSE_KEY=your_key_here
   NEW_RELIC_APP_NAME=Gaming-Leaderboard-API
   ```

### Metrics Tracked

- **API Response Times**: Track latency for each endpoint
- **Database Queries**: Identify slow queries
- **Error Rates**: Monitor failures
- **Throughput**: Requests per minute
- **Apdex Score**: User satisfaction metric

### Performance Targets

- **API Latency**: < 100ms (p95)
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

## 🚀 Deployment

### Docker Deployment (Recommended)

```bash
# Coming soon
docker-compose up -d
```

### Manual Deployment

1. **Prepare Production Environment**
   ```bash
   NODE_ENV=production
   npm install --production
   ```

2. **Database Setup**
   - Create production database
   - Run migrations
   - Setup backups

3. **Start Services**
   ```bash
   # Use PM2 for process management
   pm2 start src/server.js --name gaming-leaderboard
   ```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Assignment provided by GoComet
- Built as part of a technical assessment
- Special thanks to the open-source community

---

**Made with ❤️ for gamers worldwide**