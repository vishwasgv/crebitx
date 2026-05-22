# CREBITX | Cashflow Control System

CREBITX is a production-ready multi-tenant SaaS application designed for credit-heavy SMBs (Hardware, Ceramics, Wholesale, Distribution). It helps businesses recover money faster by transforming receivables data into actionable intelligence.

## 🚀 Quick Start (Localhost)

### 1. Prerequisites
- **Node.js**: v20+
- **PostgreSQL**: v15+
- **Redis**: v7+ (for background queues)

### 2. Installation
```bash
# Clone and install
npm install

# Setup Environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run the Application
```bash
# Terminal 1: Next.js App
npm run dev

# Terminal 2: Background Workers
npm run worker
```
Access the app at [http://localhost:3002](http://localhost:3002).

---

## 🛠️ Features
- **Module 1-3**: Full customer credit & ledger management.
- **Module 4**: Risk Intelligence Engine (Green/Yellow/Red labels).
- **Module 5**: Action-first Cashflow Dashboard.
- **Module 6**: Smart Reminders (BullMQ integration).
- **Module 11**: CSV/Excel Bulk Import.
- **Module 13**: Owner Control Panel (Rules & Cycles).
- **Module 14**: Role-based access (Owner/Staff).

## 🛡️ Security & Privacy
- **Multi-tenancy**: Strict isolation using PostgreSQL Row Level Security (RLS).
- **Verification**: Email/Phone verification flow during onboarding.
- **Data Safety**: Deny-by-default authorization on every request.

## ☁️ Deployment (Render/Vercel)
1. **Database**: Use a managed PostgreSQL instance.
2. **Redis**: Use a managed Redis instance (e.g., Upstash or Render Redis).
3. **Frontend/Backend**: CREBITX is built as a monolith. Deploy the root directory to Render/Vercel.
4. **Environment Variables**: Add all variables from `.env.example` to your platform's dashboard.

---

## 💡 Tech Stack
- **Frontend**: Next.js 15, TailwindCSS v4, shadcn/ui.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Queue**: Redis + BullMQ.
- **Auth**: NextAuth.js v5 (Beta).
- **Email**: Resend.

---
**Created with trust for Vishwajeet.**
