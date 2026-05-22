# Connecting Next.js Frontend with NestJS Backend

This guide shows how to connect the existing Crebitx Next.js frontend with the new NestJS backend.

---

## 🔄 Migration Strategy

### **Option 1: Gradual Migration (Recommended)**
Keep both systems running and migrate page by page.

### **Option 2: Full Swap**
Replace all Server Actions with REST API calls at once.

---

## ⚙️ Frontend Configuration

### **1. Create API Client**

Create `/crebitx/src/lib/api-client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor - Add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jwt_token');
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
    }
  }

  // Customer APIs
  async getCustomers(params?: { search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/customers', { params });
    return response.data;
  }

  async getCustomerById(id: string) {
    const response = await this.client.get(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(data: any) {
    const response = await this.client.post('/customers', data);
    return response.data;
  }

  async updateCustomer(id: string, data: any) {
    const response = await this.client.patch(`/customers/${id}`, data);
    return response.data;
  }

  async deleteCustomer(id: string) {
    const response = await this.client.delete(`/customers/${id}`);
    return response.data;
  }

  async addLedgerEntry(data: { customerId: string; amount: number; tag: string; note?: string }) {
    const response = await this.client.post('/customers/ledger', data);
    return response.data;
  }

  async getLedgerHistory(customerId: string, page = 1, limit = 50) {
    const response = await this.client.get('/customers/ledger/history', {
      params: { customerId, page, limit },
    });
    return response.data;
  }

  // Dashboard APIs
  async getDashboardKPIs() {
    const response = await this.client.get('/dashboard/kpis');
    return response.data;
  }

  async getCollectionCharts(months = 6) {
    const response = await this.client.get('/dashboard/charts', { params: { months } });
    return response.data;
  }

  async getRecentActivity(limit = 20) {
    const response = await this.client.get('/dashboard/activity', { params: { limit } });
    return response.data;
  }

  // Settings APIs
  async getSettings() {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await this.client.patch('/settings', data);
    return response.data;
  }

  // Auth APIs
  async register(data: { name: string; email: string; phone: string; password: string; businessName: string }) {
    const response = await this.client.post('/auth/register', data);
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  logout() {
    this.clearToken();
  }
}

export const apiClient = new ApiClient();
```

---

## 🔐 Authentication Integration

### **2. Update NextAuth Configuration**

Modify `/crebitx/src/auth.ts`:

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { apiClient } from "@/lib/api-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || "development_secret_only",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Call NestJS backend
          const response = await apiClient.login(
            credentials.email as string,
            credentials.password as string
          );

          if (response.accessToken && response.user) {
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              tenantId: response.user.tenantId,
              role: response.user.role,
              accessToken: response.accessToken,
            };
          }
          return null;
        } catch (error) {
          console.error("Authentication failed:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string;
      session.user.role = token.role as string;
      session.user.accessToken = token.accessToken as string;
      
      // Set token for API client
      if (token.accessToken) {
        apiClient.setToken(token.accessToken as string);
      }
      
      return session;
    },
  },
});
```

---

## 📝 Update Server Actions

### **3. Replace Customers Actions**

Modify `/crebitx/src/app/actions/customers.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  creditLimit: z.number().default(0),
  paymentCycle: z.number().default(30),
  gracePeriod: z.number().default(0),
});

export async function createCustomer(formData: z.infer<typeof customerSchema>) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = customerSchema.safeParse(formData);
  if (!parsed.success) return { error: "Invalid inputs" };

  try {
    // Set JWT token
    if (session.user.accessToken) {
      apiClient.setToken(session.user.accessToken);
    }

    const customer = await apiClient.createCustomer(parsed.data);
    revalidatePath("/customers");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Create customer error:", error);
    return { error: error.response?.data?.message || "Failed to create customer" };
  }
}

export async function getCustomers() {
  const session = await auth();
  if (!session) return [];

  try {
    if (session.user.accessToken) {
      apiClient.setToken(session.user.accessToken);
    }

    const response = await apiClient.getCustomers();
    return response.data || [];
  } catch (error) {
    console.error("Get customers error:", error);
    return [];
  }
}

export async function getCustomerById(id: string) {
  const session = await auth();
  if (!session) return null;

  try {
    if (session.user.accessToken) {
      apiClient.setToken(session.user.accessToken);
    }

    return await apiClient.getCustomerById(id);
  } catch (error) {
    console.error("Get customer error:", error);
    return null;
  }
}

export async function addLedgerEntry(data: {
  customerId: string;
  amount: number;
  tag: "SALE" | "RETURN" | "ADJUSTMENT" | "PAYMENT";
  note?: string;
}) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  try {
    if (session.user.accessToken) {
      apiClient.setToken(session.user.accessToken);
    }

    await apiClient.addLedgerEntry(data);
    revalidatePath(`/customers/${data.customerId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Ledger entry error:", error);
    return { error: error.response?.data?.message || "Failed to add ledger entry" };
  }
}
```

### **4. Replace Dashboard Actions**

Modify `/crebitx/src/app/actions/dashboard.ts`:

```typescript
"use server";

import { auth } from "@/auth";
import { apiClient } from "@/lib/api-client";

export async function getDashboardKPIs() {
  const session = await auth();
  if (!session) return null;

  try {
    if (session.user.accessToken) {
      apiClient.setToken(session.user.accessToken);
    }

    return await apiClient.getDashboardKPIs();
  } catch (error) {
    console.error("Dashboard error:", error);
    return {
      outstandingAmount: 0,
      overdueAmount: 0,
      inflowAmount: 0,
      topCustomers: [],
      alerts: [],
    };
  }
}
```

---

## 🌐 Environment Variables

### **5. Update `.env.local`**

```bash
# Next.js Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your_nextauth_secret_here

# NestJS Backend will run on :3000
# Next.js Frontend will run on :3002
```

---

## 🚀 Running Both Systems

### **Terminal 1 - NestJS Backend**
```bash
cd crebitx-backend
docker-compose up -d  # Start PostgreSQL & Redis
npm run db:migrate    # Run migrations
npm run start:dev     # Start backend on :3000
```

### **Terminal 2 - Next.js Frontend**
```bash
cd crebitx
npm run dev           # Start frontend on :3002
```

### **Terminal 3 - Background Workers (Optional)**
```bash
cd crebitx-backend
npm run worker        # Start BullMQ workers
```

---

## ✅ Testing the Connection

### **1. Register a New User**
- Go to `http://localhost:3002/register`
- Fill in the form
- Backend should create user + tenant

### **2. Login**
- Go to `http://localhost:3002/login`
- Use credentials from step 1
- JWT token stored in session

### **3. Create Customer**
- Go to `http://localhost:3002/customers`
- Click "Add Customer"
- Fill in form
- Backend API called → Customer created

### **4. Add Sale**
- Go to customer detail page
- Add a sale entry
- Backend creates receivable item
- Risk score calculated automatically

### **5. View Dashboard**
- Go to `http://localhost:3002/dashboard`
- Should show KPIs from backend
- Charts populated from backend data

---

## 🐛 Troubleshooting

### **CORS Issues**
If you see CORS errors, make sure CORS is enabled in NestJS:

```typescript
// main.ts (already configured in Phase 1)
app.enableCors({
  origin: ['http://localhost:3002', 'http://localhost:3000'],
  credentials: true,
});
```

### **401 Unauthorized**
- Check JWT token is being sent: Look in Network tab → Headers → Authorization
- Verify token format: `Bearer YOUR_TOKEN_HERE`
- Check token expiry: Tokens expire after 7 days (configurable)

### **Data Not Showing**
- Check backend logs: `docker logs crebitx-backend`
- Verify database has data: `docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx_db -c "SELECT COUNT(*) FROM customers;"`
- Check API response in Network tab

---

## 🎨 UI Components (No Changes Needed!)

The existing UI components should work as-is because:
- Data structure matches exactly
- API responses follow same format
- Error handling compatible

---

## 📊 Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│  Next.js    │  HTTP   │  NestJS      │   SQL   │ PostgreSQL │
│  Frontend   ├────────>│  Backend     ├────────>│  Database  │
│  (:3002)    │<────────┤  (:3000)     │<────────┤            │
└─────────────┘  JSON   └──────────────┘  Rows   └────────────┘
      │                                                  │
      │                  ┌──────────────┐              │
      └─────────────────>│  JWT Token   │              │
        Auth Session     │   Storage    │              │
                         └──────────────┘              │
                                                        │
                         ┌──────────────┐              │
                         │  Redis Cache │<─────────────┘
                         │  (BullMQ)    │   Queue Jobs
                         └──────────────┘
```

---

## 🎯 Migration Checklist

- [ ] API client created (`api-client.ts`)
- [ ] Environment variables updated
- [ ] Auth system updated to use backend
- [ ] Customer actions migrated
- [ ] Dashboard actions migrated
- [ ] Settings actions migrated
- [ ] Both systems running simultaneously
- [ ] Registration tested
- [ ] Login tested
- [ ] Customer CRUD tested
- [ ] Ledger entries tested
- [ ] Dashboard showing data
- [ ] Risk scoring working

---

## 🚀 You're Connected!

Your Next.js frontend now talks to the NestJS backend!

**Next:** Run the test flow in `PHASE2_IMPLEMENTATION.md` to verify everything works. 🎉
