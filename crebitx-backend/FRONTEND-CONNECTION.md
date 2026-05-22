# Frontend Connection Guide

## Quick Setup for Frontend Integration

### 1. Update Your Frontend Environment Variables

Create or update your `.env.local` file in the frontend project:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_API_DOCS_URL=http://localhost:4000/api/docs
```

### 2. Example API Service Configuration

Create an `api.ts` file in your frontend:

```typescript
// lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Example Auth Functions

```typescript
// lib/auth.ts
import api from './api';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken } = response.data.data;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    const { accessToken, refreshToken } = response.data.data;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    return response.data;
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data.data;
    localStorage.setItem('access_token', accessToken);
    return accessToken;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },
};
```

### 4. Example Customer Service

```typescript
// lib/customers.ts
import api from './api';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditProfile?: {
    creditLimit: number;
    paymentCycle: number;
    gracePeriod: number;
    lateFeePercent: number;
  };
}

export const customerService = {
  async getAll() {
    const response = await api.get('/customers');
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Customer>) {
    const response = await api.post('/customers', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Customer>) {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};
```

### 5. Example Dashboard Service

```typescript
// lib/dashboard.ts
import api from './api';

export const dashboardService = {
  async getKPIs() {
    const response = await api.get('/dashboard/kpis');
    return response.data.data;
  },

  async getCharts(period?: string) {
    const response = await api.get('/dashboard/charts', {
      params: { period },
    });
    return response.data.data;
  },

  async getActivity(limit?: number) {
    const response = await api.get('/dashboard/activity', {
      params: { limit },
    });
    return response.data.data;
  },
};
```

### 6. Example React Hook for Auth

```typescript
// hooks/useAuth.ts
import { create } from 'zustand';
import { authService, LoginData, RegisterData } from '@/lib/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: () => {
    const isAuthenticated = authService.isAuthenticated();
    set({ isAuthenticated });
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authService.login(data);
      set({ isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.message || 'Login failed',
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(data);
      set({ isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.message || 'Registration failed',
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ isAuthenticated: false });
  },
}));
```

### 7. Testing the Connection

#### Quick Test Command
```bash
# Test from frontend project directory
curl http://localhost:4000/api/v1/health
```

#### Test in Browser Console
```javascript
fetch('http://localhost:4000/api/v1/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 8. Common Issues & Solutions

#### CORS Error
- **Problem**: "No 'Access-Control-Allow-Origin' header"
- **Solution**: Backend is configured for `http://localhost:3002`. Ensure your frontend runs on this port.

#### 401 Unauthorized
- **Problem**: Protected routes return 401
- **Solution**: Ensure you're sending the Bearer token in Authorization header

#### Connection Refused
- **Problem**: Cannot connect to backend
- **Solution**: Verify backend is running: `docker-compose ps`

---

## 🎯 Next Steps

1. **Copy the API service files** to your frontend project
2. **Update your environment variables** with the backend URL
3. **Test authentication** by implementing login/register
4. **Implement protected routes** using the auth hook
5. **Test CRUD operations** with customers

---

## 🚀 Backend Services Status

- ✅ Backend API: `http://localhost:4000/api/v1`
- ✅ Swagger Docs: `http://localhost:4000/api/docs`
- ✅ Database: PostgreSQL on port 5432
- ✅ CORS: Configured for `http://localhost:3002`

**Ready for integration!** 🎉
