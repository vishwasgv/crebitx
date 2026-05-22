# 📮 CREBITX API - Postman Testing Guide

## 🔐 Authentication Endpoints

### 1. Register New User & Tenant
```
POST http://localhost:4000/api/v1/auth/register
Content-Type: application/json

{
  "email": "shop@example.com",
  "password": "Shop@123456",
  "firstName": "Shop",
  "lastName": "Owner",
  "tenantName": "My Shop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### 2. Login
```
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
  "email": "shop@example.com",
  "password": "Shop@123456"
}
```

### 3. Refresh Token
```
POST http://localhost:4000/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

---

## 👥 Customer Management

### 4. Create Customer
```
POST http://localhost:4000/api/v1/customers
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St, City, State"
}
```

### 5. Get All Customers
```
GET http://localhost:4000/api/v1/customers
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Optional Query Parameters:**
- `?page=1&limit=10` - Pagination
- `?search=john` - Search by name

### 6. Get Single Customer
```
GET http://localhost:4000/api/v1/customers/:customerId
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 7. Update Customer
```
PATCH http://localhost:4000/api/v1/customers/:customerId
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+9876543210"
}
```

### 8. Delete Customer
```
DELETE http://localhost:4000/api/v1/customers/:customerId
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 💰 Ledger & Credit Management

### 9. Add Ledger Entry (Sale/Credit)
```
POST http://localhost:4000/api/v1/customers/ledger
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "customerId": "customer-uuid-here",
  "amount": 1000.50,
  "tag": "SALE",
  "note": "Monthly grocery purchase"
}
```

**Available Tags:**
- `SALE` - Customer bought on credit (increases debt)
- `PAYMENT` - Customer paid money (reduces debt)
- `RETURN` - Customer returned items (reduces debt)
- `ADJUSTMENT` - Manual adjustment

### 10. Add Payment Entry
```
POST http://localhost:4000/api/v1/customers/ledger
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "customerId": "customer-uuid-here",
  "amount": 500.00,
  "tag": "PAYMENT",
  "note": "Partial payment received"
}
```

### 11. Get Ledger History
```
GET http://localhost:4000/api/v1/customers/ledger/history?customerId=customer-uuid-here
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Optional Query Parameters:**
- `?customerId=uuid` - Filter by customer
- `?startDate=2026-01-01` - From date
- `?endDate=2026-12-31` - To date
- `?tag=SALE` - Filter by transaction type
- `?page=1&limit=20` - Pagination

---

## 📊 Dashboard & Analytics

### 12. Get Dashboard KPIs
```
GET http://localhost:4000/api/v1/dashboard/kpis
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response includes:**
- Total customers
- Total receivables (money owed to you)
- Total collected this month
- Overdue amount
- Collection rate

### 13. Get Charts Data
```
GET http://localhost:4000/api/v1/dashboard/charts
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Optional Query Parameters:**
- `?period=7d` - Last 7 days
- `?period=30d` - Last 30 days
- `?period=90d` - Last 90 days

### 14. Get Recent Activity
```
GET http://localhost:4000/api/v1/dashboard/activity
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Optional Query Parameters:**
- `?limit=10` - Number of activities to return

---

## ⚙️ Settings Management

### 15. Get Business Settings
```
GET http://localhost:4000/api/v1/settings
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 16. Update Business Settings
```
PATCH http://localhost:4000/api/v1/settings
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "defaultCycle": 30,
  "defaultGrace": 7,
  "riskWeightDelay": 0.6,
  "riskWeightLimit": 0.4,
  "reminderTone": "FRIENDLY",
  "autoApproveLimit": 5000
}
```

**Setting Options:**
- `defaultCycle`: Payment cycle in days (e.g., 30, 45, 60)
- `defaultGrace`: Grace period in days (e.g., 7, 14)
- `riskWeightDelay`: Risk score weight for delays (0.0 - 1.0)
- `riskWeightLimit`: Risk score weight for credit limit (0.0 - 1.0)
- `reminderTone`: `FRIENDLY`, `BALANCED`, or `STRICT`
- `autoApproveLimit`: Auto-approve credit up to this amount

---

## 🏥 Health Check

### 17. Check API Health
```
GET http://localhost:4000/api/v1/health
```

### 18. Check Database Health
```
GET http://localhost:4000/api/v1/health/database
```

### 19. Check Redis Health
```
GET http://localhost:4000/api/v1/health/redis
```

---

## 📝 Complete Example Flow

### Step 1: Register & Login
1. Register: `POST /auth/register`
2. Save the `accessToken` from response

### Step 2: Create a Customer
```
POST /customers
Body: { "name": "John Doe", "phone": "+1234567890" }
```
Save the customer `id` from response.

### Step 3: Add a Sale (Customer bought on credit)
```
POST /customers/ledger
Body: {
  "customerId": "john-customer-id",
  "amount": 1500.00,
  "tag": "SALE",
  "note": "Bought groceries"
}
```

### Step 4: Add a Payment (Customer paid some money)
```
POST /customers/ledger
Body: {
  "customerId": "john-customer-id",
  "amount": 500.00,
  "tag": "PAYMENT",
  "note": "Partial payment"
}
```

### Step 5: Check Dashboard
```
GET /dashboard/kpis
```
You'll see:
- Total customers: 1
- Total receivables: 1000.00 (1500 - 500)
- Recent activity

---

## 🔑 Test Credentials

### Already Created Users:
1. **Email:** `test@example.com`  
   **Password:** `Test@123456`  
   **Tenant:** Test Company

2. **Email:** `shop@example.com`  
   **Password:** `Shop@123456`  
   **Tenant:** My Shop

---

## 📌 Important Notes

### Authorization Header
For all protected endpoints (except register/login), include:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Error Responses
All errors follow this format:
```json
{
  "statusCode": 400,
  "timestamp": "2026-05-11T16:00:00.000Z",
  "path": "/api/v1/customers",
  "method": "POST",
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### Success Responses
All success responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-11T16:00:00.000Z",
  "path": "/api/v1/customers"
}
```

---

## 🎯 Quick Test Checklist

- [ ] Register a new user
- [ ] Login and get access token
- [ ] Create 2-3 customers
- [ ] Add sale transactions for customers
- [ ] Add payment transactions
- [ ] Get customer list
- [ ] Get ledger history
- [ ] Check dashboard KPIs
- [ ] Update business settings
- [ ] Get single customer details

---

## 📚 API Documentation

For complete API documentation, visit:
**http://localhost:4000/api/docs**

The Swagger UI provides:
- All available endpoints
- Request/response schemas
- Try-it-out functionality
- Authentication testing

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Check if your access token is valid
- Token expires in 15 minutes, use refresh token to get new one

### 400 Bad Request
- Check request body format
- Ensure all required fields are provided
- Validate data types (strings, numbers, etc.)

### 404 Not Found
- Verify the endpoint URL
- Check if the resource ID exists

### 500 Internal Server Error
- Check backend logs: `docker-compose logs backend --tail 50`
- Verify database is running: `docker-compose ps`

---

**Backend URL:** http://localhost:4000/api/v1  
**Docs URL:** http://localhost:4000/api/docs  
**Frontend URL:** http://localhost:3002
