# CREBITX Backend - Development Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
3. [Authentication Flow](#authentication-flow)
4. [Database Access Patterns](#database-access-patterns)
5. [Adding New Modules](#adding-new-modules)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Controllers                  │  ← API Endpoints
├─────────────────────────────────────┤
│         Services                     │  ← Business Logic
├─────────────────────────────────────┤
│      Database Service                │  ← Data Access Layer
├─────────────────────────────────────┤
│         PostgreSQL                   │  ← Data Storage
└─────────────────────────────────────┘
```

### Module Structure

Each feature module follows this pattern:

```
module-name/
├── dto/                    # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── interfaces/             # TypeScript interfaces
│   └── *.interface.ts
├── guards/                 # Authorization guards
│   └── *.guard.ts
├── *.controller.ts         # REST endpoints
├── *.service.ts            # Business logic
└── *.module.ts             # Module definition
```

---

## Multi-Tenancy Implementation

### Tenant Isolation Strategy

Every database query MUST include `tenant_id` filter:

```typescript
// ❌ WRONG - No tenant isolation
const customers = await this.db.query(
  'SELECT * FROM customers'
);

// ✅ CORRECT - Tenant isolated
const customers = await this.db.query(
  'SELECT * FROM customers WHERE tenant_id = $1',
  [tenantId]
);
```

### Using Tenant Guard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { TenantId } from '@/common/decorators/tenant-id.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  
  @Get()
  async findAll(@TenantId() tenantId: string) {
    // tenantId is automatically injected from JWT
    return await this.customersService.findAll(tenantId);
  }
}
```

### Tenant Context in Service

```typescript
@Injectable()
export class CustomersService {
  constructor(private db: DatabaseService) {}

  async findAll(tenantId: string) {
    return await this.db.queryMany(
      `SELECT * FROM customers 
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    );
  }

  async create(tenantId: string, createDto: CreateCustomerDto) {
    return await this.db.queryOne(
      `INSERT INTO customers (tenant_id, name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, createDto.name, createDto.email, createDto.phone]
    );
  }
}
```

---

## Authentication Flow

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "tenantId": "tenant-uuid",
  "role": "TENANT_OWNER",
  "iat": 1640000000,
  "exp": 1640001800
}
```

### Protected Routes

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('settings')
  @Roles('TENANT_OWNER', 'TENANT_ADMIN')
  async getSettings(@CurrentUser() user) {
    // Only TENANT_OWNER and TENANT_ADMIN can access
    console.log(user); // { id, email, tenantId, role }
  }
}
```

---

## Database Access Patterns

### 1. Simple Query

```typescript
const user = await this.db.queryOne(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### 2. Multiple Rows

```typescript
const customers = await this.db.queryMany(
  'SELECT * FROM customers WHERE tenant_id = $1',
  [tenantId]
);
```

### 3. Transactions

```typescript
async transferMoney(fromId: string, toId: string, amount: number) {
  return await this.db.transaction(async (client) => {
    // Debit
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );
    
    // Credit
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );
    
    // Log transaction
    await client.query(
      'INSERT INTO transactions (from_id, to_id, amount) VALUES ($1, $2, $3)',
      [fromId, toId, amount]
    );
    
    return { success: true };
  });
}
```

### 4. Pagination

```typescript
async findAll(tenantId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.db.queryMany(
      `SELECT * FROM customers 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    ),
    this.db.queryOne(
      'SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1',
      [tenantId]
    )
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: parseInt(total.count),
      pages: Math.ceil(parseInt(total.count) / limit)
    }
  };
}
```

---

## Adding New Modules

### Step 1: Generate Module

```bash
nest g module modules/customers
nest g controller modules/customers
nest g service modules/customers
```

### Step 2: Create DTOs

```typescript
// dto/create-customer.dto.ts
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
```

### Step 3: Create Service

```typescript
// customers.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private db: DatabaseService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    return await this.db.queryOne(
      `INSERT INTO customers (tenant_id, name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, dto.name, dto.email, dto.phone]
    );
  }

  async findAll(tenantId: string) {
    return await this.db.queryMany(
      'SELECT * FROM customers WHERE tenant_id = $1',
      [tenantId]
    );
  }
}
```

### Step 4: Create Controller

```typescript
// customers.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { TenantId } from '@/common/decorators/tenant-id.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateCustomerDto
  ) {
    return await this.customersService.create(tenantId, dto);
  }

  @Get()
  async findAll(@TenantId() tenantId: string) {
    return await this.customersService.findAll(tenantId);
  }
}
```

---

## Best Practices

### 1. Always Use Parameterized Queries

```typescript
// ❌ VULNERABLE to SQL injection
const result = await this.db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ SAFE - parameterized query
const result = await this.db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

### 2. Implement Soft Deletes

```typescript
async delete(tenantId: string, id: string) {
  return await this.db.queryOne(
    `UPDATE customers 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [tenantId, id]
  );
}
```

### 3. Use Transactions for Related Operations

```typescript
async createInvoiceWithItems(tenantId: string, data) {
  return await this.db.transaction(async (client) => {
    // Create invoice
    const invoice = await client.query(
      'INSERT INTO invoices (...) VALUES (...) RETURNING *'
    );
    
    // Create invoice items
    for (const item of data.items) {
      await client.query(
        'INSERT INTO invoice_items (...) VALUES (...)',
        [invoice.rows[0].id, ...]
      );
    }
    
    return invoice.rows[0];
  });
}
```

### 4. Add Audit Logging

```typescript
async create(tenantId: string, userId: string, dto: CreateDto) {
  return await this.db.transaction(async (client) => {
    // Create entity
    const entity = await client.query(
      'INSERT INTO customers (...) VALUES (...) RETURNING *'
    );
    
    // Log action
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'CUSTOMER_CREATED', 'CUSTOMER', $3)`,
      [tenantId, userId, entity.rows[0].id]
    );
    
    return entity.rows[0];
  });
}
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL manually
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx
```

### Migration Issues

```bash
# Check migration status
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx -c "SELECT * FROM schema_migrations;"

# Reset database (CAUTION: Destroys data)
docker-compose down -v
docker-compose up postgres -d
# Wait 10 seconds for PostgreSQL to initialize
docker exec -it crebitx-postgres psql -U crebitx_user -d crebitx -f /docker-entrypoint-initdb.d/001_initial_setup.sql
```

### JWT Token Issues

```typescript
// Decode JWT token for debugging
const decoded = this.jwtService.decode(token);
console.log('Token payload:', decoded);

// Verify token manually
try {
  const verified = this.jwtService.verify(token);
  console.log('Token is valid:', verified);
} catch (error) {
  console.log('Token error:', error.message);
}
```

---

## Performance Tips

### 1. Use Database Indexes

Ensure indexes exist on frequently queried columns:

```sql
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tenant_email ON customers(tenant_id, email);
```

### 2. Connection Pooling

Already configured in `database.service.ts`:

```typescript
min: 2,   // Minimum pool connections
max: 10,  // Maximum pool connections
```

Adjust based on load:
- Low traffic: min=2, max=10
- Medium traffic: min=5, max=20
- High traffic: min=10, max=50

### 3. Query Optimization

```typescript
// ❌ N+1 Query Problem
const customers = await this.getCustomers();
for (const customer of customers) {
  customer.invoices = await this.getInvoices(customer.id);
}

// ✅ Single Query with JOIN
const customers = await this.db.queryMany(`
  SELECT 
    c.*,
    json_agg(i.*) as invoices
  FROM customers c
  LEFT JOIN invoices i ON c.id = i.customer_id
  WHERE c.tenant_id = $1
  GROUP BY c.id
`, [tenantId]);
```

---

**Next: [Phase 2 Implementation Guide](./PHASE2.md)**
