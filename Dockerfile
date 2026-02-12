# Gaming Leaderboard - Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and install root dependencies
COPY package*.json ./
RUN npm install --production=false

# Copy backend and frontend
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install all dependencies
RUN npm run install:all

# Build frontend
RUN npm run build:frontend

# Create .env file for production
RUN echo "NODE_ENV=production" > backend/.env
RUN echo "PORT=8000" >> backend/.env
RUN echo "DB_HOST=\${DB_HOST}" >> backend/.env
RUN echo "DB_PORT=\${DB_PORT}" >> backend/.env
RUN echo "DB_USER=\${DB_USER}" >> backend/.env
RUN echo "DB_PASSWORD=\${DB_PASSWORD}" >> backend/.env
RUN echo "DB_NAME=\${DB_NAME}" >> backend/.env
RUN echo "REDIS_HOST=\${REDIS_HOST}" >> backend/.env
RUN echo "REDIS_PORT=\${REDIS_PORT}" >> backend/.env
RUN echo "CACHE_TTL=60" >> backend/.env

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
