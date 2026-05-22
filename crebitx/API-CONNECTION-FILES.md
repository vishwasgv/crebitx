# 🔗 API Connection Files Guide

## Overview
The frontend connects to the backend API through several key files. Here's where everything is located and how it works.

---

## 📁 Key Files for API Connection

### 1. **Environment Configuration** 
**File:** `/crebitx/.env.local`

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_API_DOCS_URL=http://localhost:4000/api/docs

# Database (for Prisma - if using)
DATABASE_URL="postgresql://crebitx_user:crebitx_password@localhost:5432/crebitx?schema=public"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production-1234567890
```

**Purpose:** Stores the backend API URL and other configuration

---

### 2. **API Client (Axios Instance)**
**File:** `/crebitx/src/lib/api.ts`

This is the main API connection file that:
- Creates an Axios instance with backend URL
- Adds JWT tokens to requests automatically
- Handles token refresh when expired
- Redirects to login if authentication fails

**Key Features:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Request interceptor adds Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Auto-refresh token on 401 errors
    if (error.response?.status === 401) {
      // Try to refresh...
    }
  }
);
```

---

### 3. **Auth Service**
**File:** `/crebitx/src/lib/auth-service.ts`

Handles all authentication operations:
- **Register:** Creates new user and tenant
- **Login:** Authenticates user and stores tokens
- **Logout:** Clears tokens and redirects
- **Refresh Token:** Gets new access token
- **Get Current User:** Retrieves stored user data

**Methods:**
```typescript
authService.register(data) // Register new user
authService.login(data)    // Login user
authService.logout()       // Logout user
authService.getCurrentUser() // Get logged-in user info
```

**How it works:**
1. Makes API call to backend
2. Receives JWT tokens (accessToken, refreshToken)
3. Decodes JWT to extract user info
4. Stores tokens in localStorage
5. Returns user data and tokens

---

### 4. **Customer Service**
**File:** `/crebitx/src/lib/customer-service.ts`

Handles customer management:
```typescript
customerService.create(data)         // Create customer
customerService.getAll(params)       // Get all customers
customerService.getById(id)          // Get single customer
customerService.update(id, data)     // Update customer
customerService.delete(id)           // Delete customer
customerService.getCreditProfile(id) // Get credit profile
```

---

### 5. **Dashboard Service**
**File:** `/crebitx/src/lib/dashboard-service.ts`

Fetches dashboard data:
```typescript
dashboardService.getKPIs()           // Get dashboard KPIs
dashboardService.getRecentActivity() // Get recent activity
```

---

## 🔐 Authentication Flow

### Login Process:
1. User enters email and password on `/login` page
2. `authService.login()` is called
3. POST request to `http://localhost:4000/api/v1/auth/login`
4. Backend validates credentials
5. Backend returns JWT tokens:
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbGc...",
       "refreshToken": "eyJhbGc..."
     }
   }
   ```
6. Frontend decodes JWT to extract user info
7. Tokens and user info stored in localStorage:
   - `access_token`
   - `refresh_token`
   - `user` (JSON string)
8. User redirected to `/dashboard`

### Authenticated Requests:
1. Any API call automatically includes Bearer token
2. If token expired (401 error), automatically refresh
3. If refresh fails, redirect to `/login`

---

## 📍 Where Login Happens

### Login Page
**File:** `/crebitx/src/app/login/page.tsx`

The login form that:
- Collects email and password
- Validates input with Zod schema
- Calls `authService.login()`
- Shows success/error toasts
- Redirects to `/dashboard` on success

**Pre-filled credentials:**
```typescript
defaultValues: {
  email: "owner@democorp.com",
  password: "Password123!",
}
```

---

## 🧪 Testing API Connection

### Option 1: Use the API Test Page
**URL:** `http://localhost:3002/api-test`

Interactive page to test all endpoints:
- Backend Health
- Register User
- Login User
- Create Customer
- Get Customers
- Get Dashboard

### Option 2: Use cURL
```bash
# Test login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@democorp.com","password":"Password123!"}'
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Login Request
       │ (email + password)
       ▼
┌────────────────────────┐
│  /app/login/page.tsx   │
└──────┬─────────────────┘
       │
       │ 2. authService.login()
       ▼
┌────────────────────────┐
│  /lib/auth-service.ts  │
└──────┬─────────────────┘
       │
       │ 3. api.post('/auth/login')
       ▼
┌────────────────────────┐
│     /lib/api.ts        │
│  (Axios + Interceptors)│
└──────┬─────────────────┘
       │
       │ 4. HTTP POST with Bearer token
       │ (if available)
       ▼
┌─────────────────────────┐
│   Backend API           │
│  localhost:4000/api/v1  │
└──────┬──────────────────┘
       │
       │ 5. JWT tokens returned
       ▼
┌────────────────────────┐
│    localStorage        │
│  - access_token        │
│  - refresh_token       │
│  - user                │
└────────────────────────┘
```

---

## 🔧 Troubleshooting

### Login not working?

1. **Check if backend is running:**
   ```bash
   curl http://localhost:4000/api/v1/health
   ```

2. **Check browser console:**
   Open DevTools (F12) → Console tab
   Look for errors starting with 🔐, 📡, ✅, or ❌

3. **Check Network tab:**
   Open DevTools → Network tab
   Watch for POST request to `/api/v1/auth/login`
   Check response status and body

4. **Check localStorage:**
   Open DevTools → Application tab → Local Storage
   Look for: `access_token`, `refresh_token`, `user`

5. **Verify credentials:**
   - Email: `owner@democorp.com`
   - Password: `Password123!`

### Common Issues:

❌ **CORS Error**
- Backend needs to allow `http://localhost:3002`
- Check backend `.env`: `CORS_ORIGIN=http://localhost:3002`

❌ **401 Unauthorized**
- Wrong email or password
- Check database for correct credentials

❌ **Network Error**
- Backend not running
- Wrong API URL in `.env.local`

❌ **Token not stored**
- Check browser console for errors
- Try clearing localStorage and login again

---

## 📝 Summary

**Main API Files:**
1. `.env.local` - API URL configuration
2. `src/lib/api.ts` - Axios client with interceptors
3. `src/lib/auth-service.ts` - Authentication methods
4. `src/lib/customer-service.ts` - Customer operations
5. `src/lib/dashboard-service.ts` - Dashboard data
6. `src/app/login/page.tsx` - Login UI

**How to Login:**
1. Go to `http://localhost:3002/login`
2. Use: `owner@democorp.com` / `Password123!`
3. Check browser console for debug logs
4. Should redirect to `/dashboard`

**Backend:** `http://localhost:4000/api/v1`
**Frontend:** `http://localhost:3002`

---

**Last Updated:** May 7, 2026
