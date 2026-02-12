#!/bin/bash

# Gaming Leaderboard - Production Startup Script
# This script builds and starts the application

echo "🚀 Starting Gaming Leaderboard System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo "🔨 Building frontend..."
npm run build:frontend

# Start backend server
echo "🌐 Starting backend server..."
cd backend
npm start
