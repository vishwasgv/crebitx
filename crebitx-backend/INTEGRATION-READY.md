# 🎉 CREBITX Backend - Integration Ready

## ✅ Status: **FULLY OPERATIONAL**

The backend is now successfully running and ready for frontend integration!

---

## 🚀 Backend Information

### Service URLs
- **Backend API**: `http://localhost:4000/api/v1`
- **API Documentation (Swagger)**: `http://localhost:4000/api/docs`
- **Health Check**: `http://localhost:4000/api/v1/health`
- **Database**: `postgresql://localhost:5432/crebitx`

### Service Status
- ✅ **Backend**: Running on port 4000
- ✅ **PostgreSQL Database**: Running on port 5432 (healthy)
- ⏸️ **Redis**: Skipped (not required for integration testing)

---

## 📋 Available API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

### Health Check (`/api/v1/health`)
- `GET /api/v1/health` - Overall system health
- `GET /api/v1/health/database` - Database health
- `GET /api/v1/health/redis` - Redis health (placeholder)

### Customers (`/api/v1/customers`)
- `POST /api/v1/customers` - Create a new customer
- `GET /api/v1/customers` - List all customers
- `GET /api/v1/customers/:id` - Get customer by ID
- `PATCH /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer
- `POST /api/v1/customers/ledger` - Add ledger entry
- `GET /api/v1/customers/ledger/history` - Get ledger history

### Dashboard (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/kpis` - Get key performance indicators
- `GET /api/v1/dashboard/charts` - Get chart data
- `GET /api/v1/dashboard/activity` - Get recent activity

### Settings (`/api/v1/settings`)
- `GET /api/v1/settings` - Get business settings
- `PATCH /api/v1/settings` - Update business settings

---

## 🔧 Configuration

### Environment Variables
```bash
# Application
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crebitx
DB_USER=crebitx_user
DB_PASSWORD=crebitx_password

# JWT
JWT_SECRET=development-secret-key-change-in-production-1234567890
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3002
CORS_CREDENTIALS=true
```

### CORS Configuration
✅ CORS is configured to allow requests from `http://localhost:3002` (your frontend)

---

## 🗄️ Database Schema

The following tables are available:
- `tenants` - Multi-tenant organization data
- `users` - User accounts
- `roles` - User roles and permissions
- `tenant_users` - User-tenant relationships
- `customers` - Customer records
- `customer_credit_profiles` - Credit limit and payment settings
- `receivable_items` - Invoices/dues
- `payment_allocations` - Payment tracking
- `ledger_events` - Transaction history
- `risk_score_snapshots` - Risk assessment data
- `business_configs` - Business settings
- `reminder_jobs` - Payment reminders
- `imports` - Bulk import tracking

---

## 🧪 Testing the API

### Test Health Endpoint
```bash
curl http://localhost:4000/api/v1/health
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-07T...",
    "uptime": 27.33,
    "environment": "development",
    "services": {
      "database": {
        "status": "up",
        "version": "PostgreSQL 15.17...",
        "pool": {
          "total": 1,
          "idle": 1,
          "waiting": 0
        }
      }
    }
  }
}
```

### Test Register User
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "tenantName": "Test Company"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

---

## 🔐 Authentication

All protected endpoints require a JWT Bearer token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

The token is returned from the `/auth/login` and `/auth/register` endpoints.

---

## 📝 Frontend Integration Steps

### 1. Update Frontend API Base URL
Set your frontend API base URL to: `http://localhost:4000/api/v1`

### 2. Configure HTTP Client
Example for Axios:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Example API Calls

#### Register
```javascript
const register = async (data) => {
  const response = await api.post('/auth/register', {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    tenantName: data.companyName
  });
  return response.data;
};
```

#### Login
```javascript
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken, refreshToken } = response.data.data;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  return response.data;
};
```

#### Get Customers
```javascript
const getCustomers = async () => {
  const response = await api.get('/customers');
  return response.data.data;
};
```

#### Create Customer
```javascript
const createCustomer = async (customerData) => {
  const response = await api.post('/customers', customerData);
  return response.data.data;
};
```

---

## 🐳 Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f postgres
```

### Restart Services
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

---

## 🔍 Troubleshooting

### Backend not responding
```bash
# Check if container is running
docker-compose ps

# Check backend logs
docker-compose logs backend --tail=50

# Restart backend
docker-compose restart backend
```

### Database connection issues
```bash
# Check database status
docker-compose logs postgres --tail=50

# Test database connection
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx -c "SELECT NOW();"
```

### CORS errors
- Ensure your frontend is running on `http://localhost:3002`
- Check CORS_ORIGIN in `.env` file
- Verify `withCredentials: true` in your HTTP client configuration

---

## ✨ What's Been Fixed

1. ✅ Removed Redis dependency (not required for integration testing)
2. ✅ Fixed all TypeScript compilation errors
3. ✅ Created missing auth guards and decorators
4. ✅ Fixed module import paths (using `@/` alias)
5. ✅ Fixed database service type constraints
6. ✅ Fixed JWT strategy validation
7. ✅ Fixed controller route paths (removed duplicate prefixes)
8. ✅ Changed port from 3000 to 4000 (to avoid conflicts)
9. ✅ Configured CORS for frontend on port 3002
10. ✅ All modules properly loaded and routes mapped

---

## 🎯 Next Steps

1. **Start your frontend** on `http://localhost:3002`
2. **Update frontend API configuration** to point to `http://localhost:4000/api/v1`
3. **Test authentication flow** (register → login → protected routes)
4. **Test customer CRUD operations**
5. **Test dashboard data fetching**

---

## 📚 Additional Resources

- **Swagger Documentation**: Visit `http://localhost:4000/api/docs` for interactive API documentation
- **Database Migrations**: Located in `/database/migrations/`
- **Environment Config**: `.env` file in the root directory
- **Docker Compose**: `docker-compose.yml` for service configuration

---

**Backend Status**: ✅ **READY FOR INTEGRATION**

Last Updated: May 7, 2026
