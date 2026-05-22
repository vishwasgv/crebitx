# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Issues

#### Problem: "Cannot connect to the Docker daemon"

```bash
# Solution: Start Docker daemon
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

#### Problem: "Port 5432 already in use"

```bash
# Solution: Stop existing PostgreSQL or change port
# Stop existing PostgreSQL (macOS)
brew services stop postgresql

# Or change port in docker-compose.yml
ports:
  - '5433:5432'  # Use 5433 instead
```

#### Problem: "Port 3000 already in use"

```bash
# Solution: Find and kill the process
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

---

### 2. Database Issues

#### Problem: "relation does not exist"

```bash
# Solution: Run migrations
docker exec -i crebitx-postgres psql -U crebitx_user -d crebitx < database/migrations/001_initial_setup.sql
docker exec -i crebitx-postgres psql -U crebitx_user -d crebitx < database/migrations/002_seed_data.sql
```

#### Problem: "password authentication failed"

```bash
# Solution: Check credentials in .env match docker-compose.yml
cat .env | grep DB_
docker-compose down -v  # Remove volumes
docker-compose up -d postgres
```

#### Problem: "Connection timeout"

```bash
# Solution: Wait for PostgreSQL to fully start
docker-compose logs postgres
# Wait until you see: "database system is ready to accept connections"
```

---

### 3. TypeScript/Build Issues

#### Problem: "Cannot find module '@nestjs/...'"

```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Problem: "Path alias not working (@/...)"

```bash
# Solution: Rebuild the project
npm run build
npm run start:dev
```

#### Problem: Compilation errors

```bash
# Solution: Clean and rebuild
rm -rf dist
npm run build
```

---

### 4. Authentication Issues

#### Problem: "Invalid credentials" when using demo account

```bash
# Solution: Ensure seed data is loaded
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx -c "SELECT email FROM users;"

# If empty, run:
docker exec -i crebitx-postgres psql -U crebitx_user -d crebitx < database/migrations/002_seed_data.sql
```

#### Problem: "jwt must be provided"

```bash
# Solution: Include Bearer token in request
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/v1/health
```

#### Problem: JWT token expired

```bash
# Solution: Use refresh token endpoint
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

### 5. Environment Issues

#### Problem: "process.env.XXX is undefined"

```bash
# Solution: Ensure .env file exists and is loaded
cp .env.example .env
# Restart the application
docker-compose restart backend
```

#### Problem: Changes to .env not taking effect

```bash
# Solution: Restart Docker services
docker-compose down
docker-compose up -d
```

---

### 6. API Issues

#### Problem: 404 Not Found

```bash
# Solution: Check API prefix
# URL should be: http://localhost:3000/api/v1/auth/login
# NOT: http://localhost:3000/auth/login
```

#### Problem: CORS errors in browser

```bash
# Solution: Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3002
# Restart backend
docker-compose restart backend
```

#### Problem: Rate limit exceeded

```bash
# Solution: Wait 60 seconds or increase limit in .env
RATE_LIMIT_MAX=200
```

---

### 7. Logging Issues

#### Problem: Logs not showing up

```bash
# Solution: Check log level
LOG_LEVEL=debug  # In .env

# View container logs directly
docker-compose logs -f backend
```

#### Problem: Log files not created

```bash
# Solution: Ensure logs directory exists
mkdir -p logs
chmod 755 logs
```

---

### 8. Development Workflow Issues

#### Problem: Hot reload not working

```bash
# Solution: Check volume mounts in docker-compose.yml
volumes:
  - .:/app
  - /app/node_modules

# Or run locally without Docker
npm run start:dev
```

#### Problem: TypeScript watch mode crashes

```bash
# Solution: Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run start:dev
```

---

## Debugging Tips

### 1. Check Service Status

```bash
# All services
docker-compose ps

# Specific service logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs backend
```

### 2. Connect to Database Manually

```bash
# Using Docker
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx

# Useful queries
\dt                        # List tables
\d users                   # Describe users table
SELECT * FROM users;       # Query users
SELECT * FROM tenants;     # Query tenants
```

### 3. Test Redis Connection

```bash
# Using Docker
docker exec -it crebitx-redis redis-cli

# Test commands
PING                       # Should return PONG
KEYS *                     # List all keys
INFO                       # Redis info
```

### 4. Check Container Health

```bash
# Health status
docker inspect crebitx-postgres | grep -A 10 Health
docker inspect crebitx-redis | grep -A 10 Health
docker inspect crebitx-backend | grep -A 10 Health
```

### 5. View Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f --timestamps backend
```

---

## Reset Everything

If all else fails, complete reset:

```bash
# WARNING: This will delete all data!

# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove node_modules
rm -rf node_modules package-lock.json

# Clean Docker system
docker system prune -f

# Reinstall
npm install

# Restart everything
./setup.sh
```

---

## Performance Issues

### Problem: Slow API responses

```bash
# Solution 1: Check database connection pool
# In database.service.ts, increase pool size:
poolMax: 20  # Instead of 10

# Solution 2: Add database indexes
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
```

### Problem: High memory usage

```bash
# Solution: Limit Docker resources
# Add to docker-compose.yml under backend service:
mem_limit: 512m
memswap_limit: 512m
```

---

## Getting Help

### 1. Check Logs First

```bash
# Application logs
tail -f logs/application-$(date +%Y-%m-%d).log

# Error logs
tail -f logs/error-$(date +%Y-%m-%).log

# Docker logs
docker-compose logs -f
```

### 2. Enable Debug Mode

```bash
# In .env
LOG_LEVEL=debug
NODE_ENV=development

# Restart
docker-compose restart backend
```

### 3. Health Check

```bash
# Check if services are running
curl http://localhost:3000/api/v1/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-05-07T...",
  "uptime": 123.456,
  "environment": "development",
  "services": {
    "database": { "status": "up", ... },
    "redis": { "status": "up" }
  }
}
```

---

## Still Having Issues?

1. **Check Documentation**
   - README.md
   - DEVELOPMENT.md
   - PHASE1_COMPLETE.md

2. **Verify Prerequisites**
   - Node.js v20+
   - Docker v24+
   - Docker Compose v2.20+

3. **Start Fresh**
   ```bash
   ./setup.sh
   ```

4. **Report Issue**
   - Include error messages
   - Include relevant logs
   - Describe steps to reproduce
   - Environment details (OS, Docker version, Node version)

---

**Last Updated: May 2026**
