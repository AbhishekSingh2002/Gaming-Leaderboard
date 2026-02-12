# 🚀 Quick Start Guide - Gaming Leaderboard System

This guide will help you set up and run the Gaming Leaderboard System on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v7 or higher) - [Download](https://redis.io/download/)
- **Python 3** (for load testing) - [Download](https://www.python.org/downloads/)
- **Git** - [Download](https://git-scm.com/downloads/)

### Verify Installations

```bash
node --version   # Should be v16+
npm --version
psql --version   # Should be 14+
redis-cli --version  # Should be 7+
python3 --version
```

## 🔧 Installation Steps

### Step 1: Clone or Extract the Project

```bash
# If from zip file, extract it
unzip gaming-leaderboard.zip
cd gaming-leaderboard

# OR if from git
git clone <your-repo-url>
cd gaming-leaderboard
```

### Step 2: Setup PostgreSQL Database

#### Option A: Using psql Command Line

```bash
# Create database
createdb gaming_leaderboard

# Create schema
psql gaming_leaderboard < scripts/schema.sql

# Populate with test data (1M users, 5M sessions)
# NOTE: This takes 5-15 minutes!
psql gaming_leaderboard < scripts/populate_data.sql
```

#### Option B: Using Docker

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose up -d postgres redis

# Wait for containers to be healthy
docker-compose ps

# Populate data (once postgres is ready)
docker exec -i gaming-leaderboard-db psql -U postgres gaming_leaderboard < scripts/populate_data.sql
```

#### For Quick Testing (Smaller Dataset)

If you want to test faster, edit `scripts/populate_data.sql`:

```sql
-- Line 24: Change from 1000000 to 10000
SELECT 'user_' || generate_series(1, 10000);

-- Line 44: Change from 5000000 to 50000
FROM generate_series(1, 50000);
```

### Step 3: Start Redis

```bash
# Start Redis server
redis-server

# In another terminal, verify it's running
redis-cli ping
# Should respond with: PONG
```

### Step 4: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use any text editor
```

#### Configure .env File

```bash
# Server
PORT=8000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=gaming_leaderboard

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cache
CACHE_TTL=60

# New Relic (Optional - get free account at newrelic.com)
NEW_RELIC_LICENSE_KEY=your_key_here
NEW_RELIC_APP_NAME=Gaming-Leaderboard-API
```

#### Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Connected to Redis cache
🔧 Initializing database...
✅ Index created: leaderboard_total_score
✅ Index created: leaderboard_user_id
...
🚀 Gaming Leaderboard API is running on port 8000
```

#### Test Backend APIs

```bash
# Health check
curl http://localhost:8000/api/health

# Get top 10 players
curl http://localhost:8000/api/leaderboard/top

# Get specific user rank
curl http://localhost:8000/api/leaderboard/rank/1

# Submit a score
curl -X POST http://localhost:8000/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 5000}'
```

### Step 5: Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The browser should automatically open at `http://localhost:3000`

If not, manually open: http://localhost:3000

You should see:
- Live Top 10 Leaderboard with auto-refresh
- User Rank Lookup section

### Step 6: Run Load Tests

Open a new terminal:

```bash
cd scripts

# Install Python dependencies
pip3 install requests

# Run load test
python3 load-test.py

# Choose an option:
# 1. Continuous simulation (runs until Ctrl+C)
# 2. Load test (60 seconds)
# 3. Heavy load test (5 minutes)
```

## 🧪 Testing the System

### Manual API Testing

#### Test Score Submission
```bash
curl -X POST http://localhost:8000/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 5000, "game_mode": "solo"}'
```

Expected Response:
```json
{
  "success": true,
  "message": "Score submitted successfully",
  "data": {
    "gameSession": {...},
    "leaderboard": {...}
  }
}
```

#### Test Top Players
```bash
curl http://localhost:8000/api/leaderboard/top?limit=5
```

#### Test Player Rank
```bash
curl http://localhost:8000/api/leaderboard/rank/1
```

### Run Unit Tests

```bash
cd backend
npm test
```

### Check Cache Performance

```bash
# Connect to Redis
redis-cli

# Check cache keys
KEYS *

# Check specific key
GET leaderboard:top:10

# Monitor cache in real-time
MONITOR
```

## 📊 Monitoring with New Relic (Optional)

### Setup

1. Sign up at [newrelic.com](https://newrelic.com) (100GB free)
2. Get your license key
3. Add to `.env`:
   ```
   NEW_RELIC_LICENSE_KEY=your_key_here
   ```
4. Restart backend
5. Visit New Relic dashboard to see metrics

## 🐛 Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d gaming_leaderboard -c "SELECT 1"

# If permission denied, update pg_hba.conf
# or use: psql -U postgres
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
redis-server

# Check port
lsof -i :6379
```

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# OR change port in .env
PORT=8001
```

### Database Takes Too Long to Populate

```bash
# Use smaller dataset (edit populate_data.sql):
# - Change 1000000 to 10000 (users)
# - Change 5000000 to 50000 (sessions)

# Then run:
psql gaming_leaderboard < scripts/populate_data.sql
```

### Frontend Can't Connect to Backend

1. Verify backend is running: `curl http://localhost:8000/api/health`
2. Check CORS settings in backend
3. Verify API URL in frontend: `frontend/src/services/api.js`

### npm install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules
npm install
```

## 🎯 What to Check

### System is Working Correctly If:

✅ Backend starts without errors  
✅ Health check returns 200 OK  
✅ Top players API returns data  
✅ Score submission works  
✅ Frontend loads and displays leaderboard  
✅ Auto-refresh updates leaderboard  
✅ Rank lookup returns correct data  
✅ Load test runs without major errors  

### Performance Indicators:

- **API Response Time**: < 100ms for most requests
- **Cache Hit Rate**: > 80%
- **Database Connections**: < 15 active
- **Memory Usage**: < 1GB for backend
- **CPU Usage**: < 50% under normal load

## 📁 Project Structure Overview

```
gaming-leaderboard/
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── config/    # Database, Redis, New Relic
│   │   ├── routes/    # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/  # Business logic
│   │   ├── repositories/  # Database queries
│   │   └── tests/     # Unit tests
│   └── package.json
├── frontend/          # React UI
│   ├── src/
│   │   ├── components/  # Leaderboard, UserRank
│   │   ├── pages/     # Home page
│   │   └── services/  # API client
│   └── package.json
├── scripts/           # Setup and test scripts
│   ├── schema.sql     # Database schema
│   ├── populate_data.sql  # Test data
│   └── load-test.py   # Load testing
├── docs/              # Documentation
│   ├── HLD.md         # High Level Design
│   ├── LLD.md         # Low Level Design
│   └── Performance.md # Performance report
└── README.md          # Main documentation
```

## 🚀 Next Steps

After setup:

1. **Test APIs**: Use curl or Postman
2. **Run Load Tests**: See how system performs
3. **Check New Relic**: Monitor performance
4. **Read Documentation**: Understand architecture
5. **Customize**: Modify for your use case

## 📚 Documentation

- [README.md](README.md) - Full project overview
- [docs/HLD.md](docs/HLD.md) - High-level architecture
- [docs/LLD.md](docs/LLD.md) - Detailed design
- [docs/Performance.md](docs/Performance.md) - Performance analysis

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `tail -f backend/logs/error.log`
2. Review troubleshooting section above
3. Check database: `psql gaming_leaderboard`
4. Verify Redis: `redis-cli monitor`
5. Check GitHub issues (if applicable)

## 🎉 Success!

If everything is working:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Health Check: http://localhost:8000/api/health
- API Docs: Check README.md

Enjoy your high-performance gaming leaderboard system! 🎮🏆