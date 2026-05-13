# 🐛 Login Routing Issue - Troubleshooting Guide

## Problem Identified

Based on your logs:
```
GET /login?email=owner%40democorp.com&password=Password123%21 200 in 85ms
```

The form is doing a **GET request** instead of calling the JavaScript login function. This means:
1. The form is submitting as a regular HTML form (not using JavaScript)
2. Credentials are being sent in the URL as query parameters (not secure!)
3. The `onSubmit` handler is not executing

---

## Why This Happens

### Possible Causes:
1. **JavaScript not loaded yet** - Form submitted before React hydration
2. **JavaScript error** - Error preventing the handler from working
3. **React Hook Form issue** - `handleSubmit` not working correctly
4. **Button type issue** - Button not properly set as submit type

---

## Solution Steps

### Step 1: Test Login Functionality Directly

I've created a test page that bypasses the form and tests the login directly.

**Visit:** `http://localhost:3002/test-login`

1. Open browser DevTools (F12) → Console tab
2. Click the "🧪 Test Login" button
3. Watch the console for detailed logs
4. If successful, it will redirect to dashboard after 2 seconds

**Expected Console Output:**
```
🧪 Starting test login...
📡 Calling authService.login...
✅ Login successful: {user: {...}, tokens: {...}}
📦 LocalStorage tokens: {accessToken: "eyJhbGc...", ...}
🔄 Redirecting to dashboard...
```

---

### Step 2: Check Browser Console on Login Page

1. Go to `http://localhost:3002/login`
2. Open DevTools (F12) → Console tab
3. Enter credentials and click "Log In"
4. Check console for logs starting with:
   - 🔐 Login attempt
   - 📡 Calling authService
   - ✅ Login successful
   - OR ❌ Login error

**If you DON'T see these logs:**
- JavaScript is not running
- Form is submitting before JavaScript loads
- There's a JavaScript error preventing execution

**If you see these logs:**
- Login is working
- Check Network tab for the POST request
- Check localStorage for tokens

---

### Step 3: Check Network Tab

1. Open DevTools → Network tab
2. Try to login
3. Look for requests to `/api/v1/auth/login`

**What you should see:**
```
Method: POST
URL: http://localhost:4000/api/v1/auth/login
Status: 200
Response: {"success": true, "data": {"accessToken": "...", "refreshToken": "..."}}
```

**What you're currently seeing:**
```
Method: GET
URL: http://localhost:3002/login?email=...&password=...
```
This means the form is doing HTML form submission, not JavaScript.

---

### Step 4: Check for JavaScript Errors

1. Open DevTools → Console tab
2. Look for red error messages
3. Common errors:
   - "axios is not defined"
   - "Cannot read property 'login' of undefined"
   - React hydration errors

---

### Step 5: Verify Dependencies

Check if all required packages are installed:

```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx
npm list axios react-hook-form zod @hookform/resolvers
```

**Should show:**
- axios@^1.6.0 or higher
- react-hook-form@^7.48.0 or higher
- zod@^3.22.0 or higher
- @hookform/resolvers@^3.3.0 or higher

**If missing, install:**
```bash
npm install axios react-hook-form zod @hookform/resolvers
```

---

## Quick Fixes

### Fix 1: Force JavaScript to Load

Update the login form to explicitly prevent default:

```typescript
<form 
  onSubmit={(e) => {
    e.preventDefault(); // Prevent default form submission
    handleSubmit(onSubmit)(e);
  }} 
  className="space-y-5"
>
```

### Fix 2: Use Direct Event Handler

Instead of using react-hook-form's handleSubmit:

```typescript
const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  const formData = new FormData(e.currentTarget);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // Call login directly
  try {
    const result = await authService.login({ email, password });
    window.location.href = '/dashboard';
  } catch (error) {
    console.error(error);
  }
};
```

### Fix 3: Check if Backend is Accessible

Test backend directly from browser console:

```javascript
fetch('http://localhost:4000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@democorp.com',
    password: 'Password123!'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Backend response:', data))
.catch(err => console.error('❌ Backend error:', err));
```

---

## Working Credentials

Use these credentials for testing:

| Email | Password | Role |
|-------|----------|------|
| `owner@democorp.com` | `Password123!` | Owner |
| `admin@democorp.com` | `Password123!` | Admin |
| `staff@democorp.com` | `Password123!` | Staff |

---

## Test Pages

1. **Test Login Page** (New): `http://localhost:3002/test-login`
   - Tests login directly without form
   - Shows detailed console logs
   - Verifies localStorage storage

2. **API Test Page**: `http://localhost:3002/api-test`
   - Tests all backend endpoints
   - Shows responses in real-time

3. **Login Page**: `http://localhost:3002/login`
   - Production login form
   - Check browser console for logs

---

## Expected Flow

### When Login Works Correctly:

1. User enters credentials
2. Clicks "Log In" button
3. **JavaScript `onSubmit` handler executes** ← This is where it's failing
4. POST request sent to `http://localhost:4000/api/v1/auth/login`
5. Backend validates and returns JWT tokens
6. Tokens stored in localStorage
7. User redirected to `/dashboard`

### What's Happening Instead:

1. User enters credentials
2. Clicks "Log In" button
3. **HTML form submission happens** ← Problem is here
4. GET request to `/login?email=...&password=...`
5. Page reloads with credentials in URL (insecure!)
6. No JavaScript execution
7. No tokens stored
8. No redirect

---

## Next Steps

1. **Test with test-login page**: `http://localhost:3002/test-login`
2. **Check browser console** for errors
3. **Check Network tab** to see actual requests
4. **Verify axios is installed**: `npm list axios`
5. **Try clearing browser cache** and hard reload (Ctrl+Shift+R)

If the test-login page works but the login page doesn't, it means:
- The backend API is working ✅
- The auth-service is working ✅
- The login form has an issue ❌

---

## Contact Points

**Backend:** `http://localhost:4000/api/v1`
**Frontend:** `http://localhost:3002`
**Test Page:** `http://localhost:3002/test-login`
**API Test:** `http://localhost:3002/api-test`

---

**Last Updated:** May 7, 2026
**Status:** 🔍 Investigating form submission issue
