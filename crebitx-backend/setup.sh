#!/bin/bash

# CREBITX Backend - Quick Start Script
# This script automates the initial setup

set -e  # Exit on error

echo "🚀 CREBITX Backend - Phase 1 Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please review and update values if needed.${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo ""
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec crebitx-postgres pg_isready -U crebitx_user > /dev/null 2>&1; do
    echo "   Waiting..."
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
sleep 2  # Give PostgreSQL a moment

docker exec -i crebitx-postgres psql -U crebitx_user -d crebitx < database/migrations/001_initial_setup.sql
docker exec -i crebitx-postgres psql -U crebitx_user -d crebitx < database/migrations/002_seed_data.sql

echo -e "${GREEN}✅ Database migrations completed!${NC}"

# Start backend
echo ""
echo "🚀 Starting backend service..."
docker-compose up -d backend

# Wait for backend to be ready
echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Health check
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "   Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Backend failed to start. Check logs with: docker-compose logs backend${NC}"
    exit 1
fi

# Display success message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ CREBITX Backend is Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📚 API Documentation: http://localhost:3000/api/docs"
echo "🏥 Health Check:      http://localhost:3000/api/v1/health"
echo "🔐 Demo Credentials:"
echo "   Email:    owner@democorp.com"
echo "   Password: Password123!"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose logs -f backend"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart backend"
echo ""
echo -e "${YELLOW}🎉 Happy coding!${NC}"
echo ""
