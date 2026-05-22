# CREBITX Installation & Local Development Guide

## Prerequisites

- **Node.js**: 20.x or higher (LTS recommended)
- **Package Manager**: npm (v10.x+) or pnpm (v9.x+)
- **Database**: PostgreSQL 15 or higher
- **In-memory Store**: Redis 7.x or higher
- **Environment**: Linux/WSL2/macOS/Windows (PowerShell/CMD)

---

## 1. Local Setup

### 1.1 Clone the Repository
```bash
git clone <repo-url>
cd crebitx
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Database Configuration
1. Ensure PostgreSQL is running.
2. Create a database named `crebitx`.
3. Create a `.env` file from the example:
```bash
cp .env.example .env
```
4. Update `DATABASE_URL` in `.env`:
   `DATABASE_URL="postgresql://user:password@localhost:5432/crebitx?schema=public"`

### 1.4 Database Migrations & Seeding
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 2. Running the Application

### 2.1 Start Development Server
```bash
npm run dev
```
The app will be available at [http://localhost:3002](http://localhost:3002).

### 2.2 Start Background Workers (BullMQ)
Ensure Redis is running, then:
```bash
npm run worker
```

---

## 3. Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | Secret for auth encryption | - |
| `NEXTAUTH_URL` | URL of the application | `http://localhost:3002` |
| `RESEND_API_KEY` | For sending transactional emails | - |
| `WHATSAPP_API_KEY` | Placeholder for messaging | - |

---

## 4. Verification Steps

1. **Dashboard**: Navigate to `/dashboard` to see the action-first UI.
2. **Onboarding**: Go to `/register` and verify the flow (simulated in dev).
3. **Ledger**: Test adding a sale or payment to see the timeline update.
4. **Risk Scoring**: Check if customer labels (Green/Yellow/Red) update correctly.

---

## 5. Troubleshooting

- **CSS Not Loading**: Ensure `tailwind.config.ts` matches the `src/` directory structure.
- **Prisma Error**: Run `npx prisma generate` after schema changes.
- **Redis Error**: Verify Redis is active via `redis-cli ping`.
- **Version Mismatch**: Check `package.json` against recommended versions above.

---

## 6. Hosting friendly setup

### For Render/Vercel:
- **Root Directory**: `.`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: Must be set in the platform dashboard.
- **Prisma**: Ensure `npx prisma migrate deploy` is part of the build/post-deploy process.
