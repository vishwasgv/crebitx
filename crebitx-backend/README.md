# 🚀 CREBITX BACKEND - Phase 1 Complete

## Production-Ready NestJS + PostgreSQL Multi-Tenant SaaS Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

---

## ✨ Features

### Phase 1 - Core Backend Foundation ✅

- ✅ **NestJS Project Setup** - Enterprise-grade modular architecture
- ✅ **Docker Compose** - PostgreSQL, Redis, Backend containers
- ✅ **PostgreSQL with Raw SQL** - Type-safe queries using `node-postgres (pg)`
- ✅ **Environment Configuration** - Type-safe config management
- ✅ **Centralized Logging** - Winston with daily rotation
- ✅ **Swagger API Documentation** - Auto-generated OpenAPI docs
- ✅ **Global Exception Handling** - Consistent error responses
- ✅ **Interceptors & Guards** - Request logging, transformation, auth
- ✅ **JWT Authentication** - Access & refresh token implementation
- ✅ **Role-Based Access Control** - 5 default roles (SUPER_ADMIN, TENANT_OWNER, TENANT_ADMIN, STAFF, VIEWER)
- ✅ **Multi-Tenant Architecture** - Complete tenant isolation via `tenant_id`
- ✅ **SQL Migration System** - Versioned database migrations
- ✅ **Health Check Endpoints** - Database & Redis monitoring
- ✅ **Rate Limiting** - Throttle protection
- ✅ **Security** - Helmet, CORS, bcrypt password hashing

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | NestJS 10.3 (Node.js + TypeScript) |
| **Database** | PostgreSQL 15 |
| **Database Access** | Raw SQL (node-postgres `pg`) |
| **Cache/Queue** | Redis 7 + BullMQ |
| **Authentication** | JWT (Passport.js) |
| **Validation** | class-validator + class-transformer |
| **Documentation** | Swagger/OpenAPI |
| **Logging** | Winston (Daily Rotate File) |
| **Containerization** | Docker + Docker Compose |

---

## 📁 Project Structure

```
crebitx-backend/
├── database/
│   └── migrations/
│       ├── 001_initial_setup.sql       # Core schema
│       └── 002_seed_data.sql           # Demo data
├── src/
│   ├── common/
│   │   ├── decorators/                 # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── tenant-id.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── services/
│   │   │   └── logger.service.ts
│   │   └── common.module.ts
│   ├── config/
│   │   └── configuration.ts            # Environment config
│   ├── database/
│   │   ├── database.service.ts         # PostgreSQL service
│   │   └── database.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   └── auth.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   ├── interfaces/
│   │   │   │   └── auth.interface.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   └── health/
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       └── health.module.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20+ ([Download](https://nodejs.org/))
- **Docker**: v24+ ([Download](https://www.docker.com/))
- **Docker Compose**: v2.20+ (Included with Docker Desktop)

### 1. Clone & Install

```bash
cd crebitx-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services (Docker)

```bash
# Start PostgreSQL, Redis, and Backend
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### 4. Alternative: Local Development

```bash
# Start only PostgreSQL and Redis
docker-compose up postgres redis -d

# Run migrations
npm run migration:run

# Start backend locally
npm run start:dev
```

### 5. Access the Application

- **API Base URL**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

---

## 📚 API Documentation

### Interactive Swagger UI

Visit http://localhost:3000/api/docs for full API documentation.

### Core Endpoints

#### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

#### Health Checks

```http
GET /api/v1/health
GET /api/v1/health/database
GET /api/v1/health/redis
```

### Example API Calls

#### 1. Register New User & Tenant

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mycompany.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210",
    "tenantName": "My Company",
    "tenantSlug": "my-company"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mycompany.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### 4. Protected Route (Example)

```bash
curl -X GET http://localhost:3000/api/v1/health \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🗄️ Database Schema

### Core Tables

#### 1. `tenants`
```sql
- id (UUID, PK)
- name (VARCHAR)
- slug (VARCHAR, UNIQUE)
- logo_url, industry
- subscription_plan (FREE/BASIC/PRO/ENTERPRISE)
- status (ACTIVE/SUSPENDED/INACTIVE)
- settings (JSONB)
- created_at, updated_at, deleted_at
```

#### 2. `users`
```sql
- id (UUID, PK)
- email (CITEXT, UNIQUE)
- phone, password_hash
- first_name, last_name, full_name (GENERATED)
- avatar_url
- is_email_verified, is_phone_verified
- last_login_at, last_login_ip
- status (ACTIVE/INACTIVE/SUSPENDED/PENDING_VERIFICATION)
- created_at, updated_at, deleted_at
```

#### 3. `roles`
```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- display_name, description
- permissions (JSONB)
- is_system (BOOLEAN)
```

**Default Roles:**
- `SUPER_ADMIN` - Full system access
- `TENANT_OWNER` - Full tenant access
- `TENANT_ADMIN` - Administrative access
- `STAFF` - Limited access
- `VIEWER` - Read-only access

#### 4. `tenant_users`
```sql
- id (UUID, PK)
- tenant_id (FK -> tenants)
- user_id (FK -> users)
- role_id (FK -> roles)
- status (ACTIVE/INACTIVE/INVITED)
- UNIQUE(tenant_id, user_id)
```

#### 5. `audit_logs`
```sql
- id (UUID, PK)
- tenant_id (FK -> tenants)
- user_id (FK -> users)
- action, entity_type, entity_id
- old_values, new_values (JSONB)
- ip_address, user_agent, request_id
- created_at
```

#### 6. `refresh_tokens`
```sql
- id (UUID, PK)
- user_id (FK -> users)
- token_hash (VARCHAR, UNIQUE)
- device_info (JSONB)
- expires_at
- revoked_at
- created_at
```

### Database Migrations

```bash
# Apply migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

## ⚙️ Environment Configuration

### `.env` Variables

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crebitx
DB_USER=crebitx_user
DB_PASSWORD=crebitx_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_DIR=logs

# CORS
CORS_ORIGIN=http://localhost:3002
CORS_CREDENTIALS=true
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debug mode

# Build
npm run build              # Build for production
npm run start:prod         # Run production build

# Linting & Formatting
npm run lint               # Run ESLint
npm run format             # Format with Prettier

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Generate coverage report
npm run test:e2e           # Run end-to-end tests
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up postgres -d

# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild containers
docker-compose up --build
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- [ ] Use managed Redis (AWS ElastiCache, Redis Cloud)
- [ ] Enable SSL for database connections
- [ ] Configure proper CORS origins
- [ ] Set up monitoring (CloudWatch, Datadog)
- [ ] Configure log aggregation (ELK Stack, CloudWatch Logs)
- [ ] Set up CI/CD pipeline
- [ ] Enable database backups
- [ ] Configure auto-scaling

### Docker Production Build

```bash
# Build production image
docker build --target production -t crebitx-backend:latest .

# Run production container
docker run -d \
  --name crebitx-backend \
  --env-file .env.production \
  -p 3000:3000 \
  crebitx-backend:latest
```

---

## 📝 Next Steps (Phase 2)

Phase 1 is **complete**! Ready to proceed with:

✅ **Phase 2**: Business Modules (Customers, Invoices, Collections, Notifications, Dashboard, Analytics)

To begin Phase 2:
```bash
# Next command will scaffold Phase 2 modules
npm run generate:phase2
```

---

## 🤝 Demo Credentials

After running migrations with seed data:

```
Email: owner@democorp.com
Password: Password123!
Tenant: CREBITX Demo Corp
```

---

## 📖 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 🎉 Features Implemented

✅ Production-ready NestJS setup  
✅ Docker containerization (PostgreSQL + Redis + Backend)  
✅ Raw SQL with connection pooling  
✅ JWT authentication & refresh tokens  
✅ Multi-tenant architecture  
✅ Role-based access control  
✅ Global error handling  
✅ Request logging & transformation  
✅ API documentation (Swagger)  
✅ Health check endpoints  
✅ Environment configuration  
✅ Database migrations  
✅ Audit logging system  

---

## 👨‍💻 Author

**CREBITX Team**  
Created with ❤️ for scalable SaaS applications

---

## 📄 License

UNLICENSED - Private

---

**Phase 1 Status: ✅ COMPLETE**

Ready for Phase 2 implementation! 🚀
