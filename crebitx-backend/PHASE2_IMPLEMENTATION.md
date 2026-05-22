# Phase 2 - Complete Implementation Guide

## 🎯 Overview

Phase 2 adds complete business logic modules to CREBITX backend to match the frontend requirements exactly. This implementation provides all REST APIs needed for the frontend to function.

---

## 📦 What's Included

### **Modules Implemented:**

1. ✅ **Customers Module** - Full CRUD, credit profiles, search & pagination
2. ✅ **Ledger Module** - Transaction history (SALE, PAYMENT, RETURN, ADJUSTMENT)
3. ✅ **Dashboard Module** - KPIs, charts, alerts, activity timeline
4. ✅ **Settings Module** - Business configuration per tenant
5. ✅ **Risk Engine Module** - Automatic risk scoring (GREEN/YELLOW/RED)

### **Database Tables Added:**
- `customers` - Customer master data
- `customer_credit_profiles` - Credit limits, payment cycles
- `ledger_events` - Transaction history
- `receivable_items` - Unpaid invoices with due dates
- `payment_allocations` - Payment → Receivable mapping (FIFO)
- `risk_score_snapshots` - Risk history with levels
- `reminder_jobs` - Scheduled reminders
- `imports` - Bulk import tracking
- `business_configs` - Tenant-specific settings
- `subscriptions` - Plan management

---

## 🚀 Quick Start

### **1. Run Database Migration**

```bash
# Make sure PostgreSQL and Redis are running
docker-compose up -d postgres redis

# Run the new migration
npm run db:migrate
```

### **2. Install Dependencies (if not done)**

```bash
npm install
```

### **3. Start the Application**

```bash
# Start backend API
npm run start:dev

# In another terminal, start background workers (optional for Phase 2)
npm run worker
```

### **4. Access Swagger Documentation**

```
http://localhost:3000/api/docs
```

---

## 📚 API Endpoints

### **Authentication**
```http
POST   /api/v1/auth/register     # Register new user + tenant
POST   /api/v1/auth/login        # Login (returns JWT)
GET    /api/v1/auth/profile      # Get current user profile
```

### **Customers**
```http
POST   /api/v1/customers                # Create customer
GET    /api/v1/customers                # List customers (paginated, searchable)
GET    /api/v1/customers/:id            # Get customer details
PATCH  /api/v1/customers/:id            # Update customer
DELETE /api/v1/customers/:id            # Delete customer (soft delete)
POST   /api/v1/customers/ledger         # Add ledger entry
GET    /api/v1/customers/ledger/history # Get ledger history
```

### **Dashboard**
```http
GET    /api/v1/dashboard/kpis      # Get KPIs (outstanding, overdue, inflow)
GET    /api/v1/dashboard/charts    # Get collection chart data
GET    /api/v1/dashboard/activity  # Get recent activity timeline
```

### **Settings**
```http
GET    /api/v1/settings      # Get business settings
PATCH  /api/v1/settings      # Update settings
```

### **Health**
```http
GET    /health               # Health check
GET    /health/db            # Database connectivity
GET    /health/redis         # Redis connectivity
```

---

## 🧪 Testing the Integration

### **Test Flow (matches frontend exactly):**

#### **1. Register & Login**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vishwajeet",
    "email": "vishwa@crebitx.com",
    "phone": "9876543210",
    "password": "password123",
    "businessName": "My Business"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vishwa@crebitx.com",
    "password": "password123"
  }'

# Copy the JWT token from response
```

#### **2. Create a Customer**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Global Tech Solutions",
    "phone": "9876543210",
    "email": "contact@globaltech.com",
    "address": "123 Business Park, Bangalore",
    "creditLimit": 500000,
    "paymentCycle": 30,
    "gracePeriod": 7
  }'
```

#### **3. Add a Sale (Ledger Entry)**
```bash
curl -X POST http://localhost:3000/api/v1/customers/ledger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID_FROM_STEP_2",
    "amount": 150000,
    "tag": "SALE",
    "note": "Invoice #GT-102"
  }'
```

#### **4. Add a Payment**
```bash
curl -X POST http://localhost:3000/api/v1/customers/ledger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID_FROM_STEP_2",
    "amount": 50000,
    "tag": "PAYMENT",
    "note": "Partial payment received"
  }'
```

#### **5. Check Dashboard**
```bash
curl -X GET http://localhost:3000/api/v1/dashboard/kpis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔗 Connecting with Frontend

### **Update Frontend API Base URL**

In your Next.js frontend (`crebitx/`), update the API configuration:

```typescript
// src/lib/api.ts or similar
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token'); // or from session
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Update Server Actions to use REST API**

Replace Prisma calls with API calls. Example:

```typescript
// Before (Prisma):
export async function getCustomers() {
  return await prisma.customer.findMany({ ... });
}

// After (REST API):
export async function getCustomers() {
  const response = await fetch('http://localhost:3000/api/v1/customers', {
    headers: {
      Authorization: `Bearer ${await getJWTToken()}`,
    },
  });
  return await response.json();
}
```

---

## 🗂️ Data Models

### **Customer**
```typescript
{
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditProfile: {
    creditLimit: number;
    paymentCycle: number;
    gracePeriod: number;
    lateFeePercent: number;
    reminderFreq: number;
  };
  outstandingBalance: number;
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  riskScore: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Ledger Entry**
```typescript
{
  id: string;
  tenantId: string;
  customerId: string;
  amount: number;
  tag: 'SALE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  note?: string;
  eventDate: Date;
}
```

### **Dashboard KPIs**
```typescript
{
  outstandingAmount: number;
  overdueAmount: number;
  inflowAmount: number;
  topCustomers: Array<{ name: string; amount: number }>;
  alerts: Array<{ name: string; amount: number; overdue: string; phone: string }>;
}
```

---

## 🎨 Key Features

### **1. Multi-Tenancy**
- Every request automatically filtered by `tenant_id`
- JWT token contains `tenantId`
- `TenantGuard` ensures isolation

### **2. Risk Scoring**
- Automatic calculation on every payment/sale
- Factors: Overdue days (60% weight), Credit limit (40% weight)
- History tracked in `risk_score_snapshots`

### **3. Payment Allocation (FIFO)**
- Payments automatically allocated to oldest receivables first
- Partial payment support
- Full audit trail in `payment_allocations`

### **4. Audit Logging**
- All critical actions logged
- Includes user, action, entity, timestamp
- Accessible via `/api/v1/audit` (Phase 1)

---

## 🔒 Security Notes

1. **All endpoints require JWT authentication** (except `/auth/login` and `/auth/register`)
2. **Tenant isolation** enforced at database query level
3. **Role-based access** supported (OWNER, STAFF)
4. **Rate limiting** enabled (100 requests/minute per IP)
5. **Input validation** using class-validator DTOs

---

## 🐛 Troubleshooting

### **Issue: "Cannot find module '@nestjs/common'"**
```bash
npm install
```

### **Issue: "Database connection failed"**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check connection string in .env
DATABASE_URL=postgresql://crebitx_user:crebitx_password@localhost:5432/crebitx_db
```

### **Issue: "Unauthorized" on API calls**
```bash
# Make sure you're sending JWT token in Authorization header
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Issue: "Customer not found"**
```bash
# Verify customer belongs to your tenant
# Each tenant can only see their own customers
```

---

## 📈 Next Steps

### **Phase 3 - Queue & Real-time** (Coming Next):
- BullMQ job processing
- Reminder scheduling
- WebSocket support
- Real-time dashboard updates

### **Phase 4 - AI Integration**:
- Risk prediction models
- Payment behavior analysis
- Smart collection strategies

---

## 📝 Migration Notes

The migration `004_business_tables.sql` includes:
- ✅ All table schemas
- ✅ Indexes for performance
- ✅ Foreign key constraints
- ✅ Triggers for `updated_at`
- ✅ Helper views for analytics
- ✅ Default business config creation

---

## 🎉 You're Ready!

The backend now has **full parity** with the frontend schema. You can:

1. ✅ Register users and create tenants
2. ✅ Create and manage customers
3. ✅ Add sales and payments
4. ✅ View dashboard KPIs
5. ✅ Update business settings
6. ✅ Auto-calculate risk scores

**Test it now:** Open Swagger docs at `http://localhost:3000/api/docs` 🚀
