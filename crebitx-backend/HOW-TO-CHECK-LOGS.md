# 📋 How to Check Backend Logs

## ✅ Backend Status

**Backend is running on:** `http://localhost:4000/api/v1`  
**API Documentation:** `http://localhost:4000/api/docs`  
**Database Port:** `5432`

---

## 🔍 Commands to Check Logs

### 1. View Last 50 Lines of Backend Logs
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose logs backend --tail 50
```

### 2. Follow Backend Logs in Real-Time (Live Monitoring)
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose logs backend -f
```
Press `Ctrl+C` to stop following logs.

### 3. View All Container Status
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose ps
```

### 4. View Database Logs
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose logs postgres --tail 50
```

### 5. View Both Backend + Database Logs
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose logs --tail 50
```

---

## 🐛 Troubleshooting Registration Error

When you see "Something went wrong during registration" on the website, follow these steps:

### Step 1: Open a Terminal and Monitor Logs
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose logs backend -f
```

### Step 2: Try to Register from Website
Go to your website and try to register a new user.

### Step 3: Watch the Terminal
You'll see logs appearing in real-time showing:
- ✅ Successful requests
- ❌ Errors with details
- 🔍 What went wrong

---

## 📊 Current Backend Status

```
Container: crebitx-backend
Status: ✅ Running (Up 12 minutes)
Port: 4000 → 4000
URL: http://localhost:4000/api/v1

Container: crebitx-postgres  
Status: ✅ Healthy
Port: 5432 → 5432
Database: crebitx
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Frontend Can't Connect to Backend
**Check if URL is correct in frontend:**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Issue 2: CORS Error
**Check backend .env has:**
```
CORS_ORIGIN=http://localhost:3002
```

### Issue 3: Registration Fails
**Possible causes:**
1. Email already exists (401 error)
2. Missing required fields (400 error)
3. Database connection issue (500 error)

**Solution:** Check logs with:
```bash
docker-compose logs backend --tail 100
```

---

## 🎯 Quick Health Check

```bash
# Check if backend is responding
curl http://localhost:4000/api/v1/health

# Expected response:
# {"success":true,"data":{"status":"ok",...}}
```

---

## 📝 Log Format

Backend logs show:
```
[Timestamp] [Level] info/error: Message
```

Example:
```
2026-05-12 04:33:32 [HTTP] info: ➡️  POST /api/v1/auth/register
2026-05-12 04:33:32 [HTTP] info: ⬅️  POST /api/v1/auth/register 201 - 45ms
```

---

## 🚨 When Registration Fails, Look For:

1. **401 Unauthorized** → Email already exists
2. **400 Bad Request** → Missing/invalid fields
3. **500 Internal Error** → Backend/database issue
4. **Network Error** → Backend not running or wrong URL

---

## 💡 Pro Tips

1. **Keep logs running in separate terminal** while testing
2. **Use `-f` flag** to follow logs in real-time
3. **Filter logs** with grep:
   ```bash
   docker-compose logs backend | grep ERROR
   ```
4. **Check last error only:**
   ```bash
   docker-compose logs backend --tail 100 | grep -A 5 error
   ```

---

## 🔄 Restart Backend

If you make changes and need to restart:
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose restart backend
```

Or rebuild if you changed code:
```bash
docker-compose down
docker-compose up -d --build
```
