# Setup Instructions for Gaming Leaderboard

## 🚀 Quick Setup Guide

### 1. Install PostgreSQL & Redis
```bash
# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/

# Install Redis (Windows)
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL: sudo apt-get install redis-server
```

### 2. Create Database
```bash
# Open PostgreSQL shell (psql)
CREATE DATABASE gaming_leaderboard;
CREATE USER gaming_app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gaming_leaderboard TO gaming_app_user;
```

### 3. Setup Environment Variables
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your credentials:
DB_HOST=localhost
DB_PORT=5432
DB_USER=gaming_app_user
DB_PASSWORD=your_password
DB_NAME=gaming_leaderboard

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Run Database Schema
```bash
cd scripts
psql gaming_leaderboard -U gaming_app_user < schema.sql
```

### 5. Populate Test Data (Optional)
```bash
# For quick testing (10K users, 50K sessions)
# Edit populate_data.sql and reduce the numbers

# For full dataset (1M users, 5M sessions) - takes 10-15 minutes
psql gaming_leaderboard -U gaming_app_user < populate_data.sql
```

### 6. Start Services
```bash
# Start Redis server
redis-server

# Start backend
cd backend
npm install
npm start

# Start frontend (new terminal)
cd frontend
npm install
npm start
```

### 7. New Relic Setup (Optional)
1. Sign up at [newrelic.com](https://newrelic.com)
2. Get your license key
3. Add to backend/.env:
   ```
   NEW_RELIC_LICENSE_KEY=your_key_here
   ```

## 🔧 Configuration Files Created

### ✅ Database Configuration
- `backend/src/config/db.js` - PostgreSQL connection
- `backend/.env.example` - Environment template

### ✅ Redis Configuration  
- `backend/src/config/redis.js` - Redis client with caching helpers

### ✅ New Relic Configuration
- `backend/newrelic.js` - Monitoring initialization

## 📊 Testing the Setup

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Submit Score
```bash
curl -X POST http://localhost:8000/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "score": 1000, "game_mode": "solo"}'
```

### Get Top Players
```bash
curl http://localhost:8000/api/leaderboard/top?limit=10
```

## 🚨 Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in .env file
- Ensure database exists: `psql -l`

### Redis Connection Issues
- Check Redis is running: `redis-cli ping`
- Verify Redis port (default: 6379)

### Port Conflicts
- Change PORT in .env if 8000 is occupied
- Ensure frontend and backend use different ports

## 🎯 Next Steps

1. Run load tests: `cd scripts && python3 load-test.py`
2. Monitor performance in New Relic dashboard
3. Deploy to Render using deployment guide in README.md
