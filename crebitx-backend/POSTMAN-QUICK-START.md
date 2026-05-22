# 🚀 POSTMAN QUICK START - CREBITX API

## ✅ Step-by-Step Testing Guide

### STEP 1️⃣: LOGIN

**Method:** `POST`  
**URL:** `http://localhost:4000/api/v1/auth/login`  
**Headers Tab:**
- `Content-Type: application/json`

**Body Tab** → Select **raw** → Select **JSON**:
```json
{
  "email": "test@example.com",
  "password": "Test@123456"
}
```

**Click SEND** ✅

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

📝 **COPY the `accessToken`** - You'll need it for next steps!

---

### STEP 2️⃣: CREATE A CUSTOMER

**Method:** `POST`  
**URL:** `http://localhost:4000/api/v1/customers`  
**Headers Tab:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE` ⚠️ Replace with token from Step 1

**Body Tab** → **raw** → **JSON**:
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main Street"
}
```

**Click SEND** ✅

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-xyz",
    "name": "John Doe",
    ...
  }
}
```

📝 **COPY the customer `id`** - You'll need it for next steps!

---

### STEP 3️⃣: ADD A SALE (Customer bought on credit)

**Method:** `POST`  
**URL:** `http://localhost:4000/api/v1/customers/ledger`  
**Headers Tab:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`

**Body Tab** → **raw** → **JSON**:
```json
{
  "customerId": "PUT_CUSTOMER_ID_HERE",
  "amount": 1500.00,
  "tag": "SALE",
  "note": "Bought groceries on credit"
}
```

**Click SEND** ✅

---

### STEP 4️⃣: ADD A PAYMENT (Customer paid money)

**Method:** `POST`  
**URL:** `http://localhost:4000/api/v1/customers/ledger`  
**Headers Tab:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`

**Body Tab** → **raw** → **JSON**:
```json
{
  "customerId": "PUT_CUSTOMER_ID_HERE",
  "amount": 500.00,
  "tag": "PAYMENT",
  "note": "Received partial payment"
}
```

**Click SEND** ✅

---

### STEP 5️⃣: GET ALL CUSTOMERS

**Method:** `GET`  
**URL:** `http://localhost:4000/api/v1/customers`  
**Headers Tab:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`

**Click SEND** ✅

You'll see all customers with their credit balances!

---

### STEP 6️⃣: GET LEDGER HISTORY

**Method:** `GET`  
**URL:** `http://localhost:4000/api/v1/customers/ledger/history?customerId=PUT_CUSTOMER_ID_HERE`  
**Headers Tab:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`

**Click SEND** ✅

You'll see all transactions (sales, payments) for this customer!

---

### STEP 7️⃣: GET DASHBOARD

**Method:** `GET`  
**URL:** `http://localhost:4000/api/v1/dashboard/kpis`  
**Headers Tab:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`

**Click SEND** ✅

You'll see:
- Total customers
- Total money owed to you
- Collection rate
- Overdue amounts

---

## 📋 Transaction Types (Tags)

When adding ledger entries, use these tags:

| Tag | Meaning | Effect on Balance |
|-----|---------|-------------------|
| `SALE` | Customer bought on credit | Increases debt ⬆️ |
| `PAYMENT` | Customer paid money | Reduces debt ⬇️ |
| `RETURN` | Customer returned items | Reduces debt ⬇️ |
| `ADJUSTMENT` | Manual correction | Can increase or decrease |

---

## 🔑 Test Account

**Email:** `test@example.com`  
**Password:** `Test@123456`

---

## ❓ Common Issues

### ❌ 401 Unauthorized
→ Check your Authorization header  
→ Make sure token is not expired (15 min expiry)  
→ Re-login to get new token

### ❌ 400 Bad Request
→ Check your JSON format  
→ Make sure all required fields are present  
→ Verify customerId exists

### ❌ Can't connect
→ Check backend is running: `docker-compose ps`  
→ Verify URL is: `http://localhost:4000/api/v1`

---

## 🎯 Quick Checklist

- [ ] Step 1: Login ✅
- [ ] Step 2: Create customer ✅
- [ ] Step 3: Add sale ✅
- [ ] Step 4: Add payment ✅
- [ ] Step 5: Get customers ✅
- [ ] Step 6: Get ledger history ✅
- [ ] Step 7: Check dashboard ✅

---

## 💡 Pro Tips

1. **Save your access token** in Postman as an environment variable
2. **Create a collection** for all your requests
3. **Use the token** for 15 minutes, then re-login
4. **Test the flow** in order: Login → Create Customer → Add Sale → Add Payment

---

**Backend:** http://localhost:4000/api/v1  
**API Docs:** http://localhost:4000/api/docs  
**Frontend:** http://localhost:3002
