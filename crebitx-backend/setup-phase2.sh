#!/bin/bash

# Phase 2 Complete Setup Script
# This script creates all working files for the backend

echo "🚀 Starting Phase 2 Complete Setup..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
sleep 5

# Run migrations
PGPASSWORD=postgres psql -h localhost -U postgres -d crebitx_db -f migrations/001_init_schema.sql
PGPASSWORD=postgres psql -h localhost -U postgres -d crebitx_db -f migrations/002_business_modules.sql

echo -e "${GREEN}✅ Migrations completed${NC}"

echo -e "${BLUE}🏗️  Building the application...${NC}"
npm run build

echo -e "${GREEN}✅ Phase 2 setup complete!${NC}"
echo ""
echo "To start the backend:"
echo "  npm run start:dev"
echo ""
echo "To test the API:"
echo "  curl http://localhost:3000/health"
echo ""
echo "Swagger Documentation:"
echo "  http://localhost:3000/api-docs"
