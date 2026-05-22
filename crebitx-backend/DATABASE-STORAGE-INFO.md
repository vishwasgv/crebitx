# 🗄️ CREBITX Database Storage Information

## 📍 Where is the Database Stored?

### **Physical Location (Docker Volume)**
```
/var/lib/docker/volumes/crebitx-backend_postgres_data/_data
```

This is a **Docker volume** that persists your database data even when containers are stopped or removed.

### **Volume Details**
- **Volume Name:** `crebitx-backend_postgres_data`
- **Driver:** local
- **Created:** May 7, 2026
- **Container:** `crebitx-postgres`
- **Image:** `postgres:15-alpine`

---

## 🗂️ Database Tables

Your database currently has **17 tables**:

### **Core Tables**
1. ✅ **users** - User accounts (7 users registered)
2. ✅ **tenants** - Business/tenant information
3. ✅ **tenant_users** - Links users to tenants
4. ✅ **roles** - User roles and permissions
5. ✅ **refresh_tokens** - JWT refresh tokens

### **Customer & Credit Management**
6. ✅ **customers** - Customer records (0 customers currently)
7. ✅ **customer_credit_profiles** - Credit limits and payment terms
8. ✅ **ledger_events** - All transactions (SALE, PAYMENT, etc.)
9. ✅ **receivable_items** - Outstanding invoices/dues
10. ✅ **payment_allocations** - Payment tracking

### **Risk & Analytics**
11. ✅ **risk_score_snapshots** - Customer risk scores
12. ✅ **business_configs** - Business settings
13. ✅ **reminder_jobs** - Payment reminders queue

### **System Tables**
14. ✅ **subscriptions** - Subscription plans
15. ✅ **imports** - Import history tracking
16. ✅ **audit_logs** - System audit trail
17. ✅ **schema_migrations** - Database version tracking

---

## 📊 Current Database Stats

| Metric | Count |
|--------|-------|
| **Total Users** | 7 |
| **Total Customers** | 0 |
| **Total Tenants** | 7 |
| **Total Tables** | 17 |

---

## 🔌 Database Connection Details

### **From Your Mac (Host Machine)**
```
Host: localhost
Port: 5432
Database: crebitx
Username: crebitx_user
Password: crebitx_password
```

**Connection String:**
```
postgresql://crebitx_user:crebitx_password@localhost:5432/crebitx
```

### **From Backend Container**
```
Host: postgres
Port: 5432
Database: crebitx
Username: crebitx_user
Password: crebitx_password
```

**Connection String:**
```
postgresql://crebitx_user:crebitx_password@postgres:5432/crebitx
```

---

## 🛠️ How to Access the Database

### **Option 1: Via Docker CLI**
```bash
cd /Users/mallikarjunparoji/Documents/aszurex/crebitx-backend
docker-compose exec postgres psql -U crebitx_user -d crebitx
```

### **Option 2: Via psql on Mac (if installed)**
```bash
psql -h localhost -p 5432 -U crebitx_user -d crebitx
```

### **Option 3: Database GUI Tools**
Use any PostgreSQL client:
- **pgAdmin** (https://www.pgadmin.org/)
- **DBeaver** (https://dbeaver.io/)
- **TablePlus** (https://tableplus.com/)
- **Postico** (https://eggerapps.at/postico/)

**Connection Details:**
- Host: `localhost`
- Port: `5432`
- Database: `crebitx`
- Username: `crebitx_user`
- Password: `crebitx_password`

---

## 📦 Useful Database Commands

### **List all tables**
```sql
\dt
```

### **See table structure**
```sql
\d table_name
```

### **Count records in a table**
```sql
SELECT COUNT(*) FROM table_name;
```

### **View all users**
```sql
SELECT id, email, first_name, last_name, status FROM users;
```

### **View all customers**
```sql
SELECT id, name, phone, email FROM customers;
```

### **View ledger transactions**
```sql
SELECT * FROM ledger_events ORDER BY event_date DESC LIMIT 10;
```

---

## 💾 Backup & Restore

### **Backup Database**
```bash
docker-compose exec postgres pg_dump -U crebitx_user crebitx > backup.sql
```

### **Restore Database**
```bash
docker-compose exec -T postgres psql -U crebitx_user crebitx < backup.sql
```

### **Backup Docker Volume**
```bash
docker run --rm -v crebitx-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## 🗑️ Clear All Data (CAUTION!)

### **Delete all customers and transactions**
```bash
docker-compose exec postgres psql -U crebitx_user -d crebitx -c "TRUNCATE customers, ledger_events, receivable_items RESTART IDENTITY CASCADE;"
```

### **Delete all users (except keep some)**
```bash
docker-compose exec postgres psql -U crebitx_user -d crebitx -c "DELETE FROM users WHERE email NOT IN ('test@example.com');"
```

### **Reset entire database (DELETES EVERYTHING)**
```bash
docker-compose down
docker volume rm crebitx-backend_postgres_data
docker-compose up -d
```

---

## 🔍 Check Database Size

### **Total database size**
```bash
docker-compose exec postgres psql -U crebitx_user -d crebitx -c "SELECT pg_size_pretty(pg_database_size('crebitx'));"
```

### **Size of each table**
```bash
docker-compose exec postgres psql -U crebitx_user -d crebitx -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## 🔐 Database Security

### **Current Setup**
- ✅ Password protected
- ✅ Running in isolated Docker network
- ✅ Persistent storage in Docker volume
- ⚠️ Port 5432 exposed to localhost (development only)

### **Production Recommendations**
1. Change default passwords
2. Don't expose port 5432 to public
3. Enable SSL/TLS connections
4. Regular automated backups
5. Set up read replicas
6. Configure connection pooling

---

## 📝 Migration Files Location

Migration files are stored at:
```
/Users/mallikarjunparoji/Documents/aszurex/crebitx-backend/database/migrations/
```

These SQL files are automatically executed when the database container first starts.

Current migration:
- `001_initial_setup.sql` - Creates core tables (users, tenants, etc.)
- `002_business_modules.sql` - Creates business tables (customers, ledger, etc.)

---

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| **Start database** | `docker-compose up -d postgres` |
| **Stop database** | `docker-compose stop postgres` |
| **View logs** | `docker-compose logs postgres` |
| **Access psql** | `docker-compose exec postgres psql -U crebitx_user -d crebitx` |
| **Check status** | `docker-compose ps` |
| **Restart database** | `docker-compose restart postgres` |

---

## ✅ Database Health

**Status:** ✅ Healthy and Running
- Container: `crebitx-postgres`
- Uptime: 12 hours
- Health check: Passing
- Port: 5432 (accessible)

---

**Last Updated:** May 12, 2026  
**Database Version:** PostgreSQL 15.17  
**Docker Volume:** crebitx-backend_postgres_data
