# Phase 2 - Business Modules Planning

## Overview
Phase 2 will implement the core business logic for CREBITX SaaS platform.

## Modules to Implement

### 1. Customers Module
- CRUD operations for customer management
- Credit profile management
- Customer search and filtering
- Bulk import functionality
- Customer status tracking

### 2. Invoices Module
- Invoice creation and management
- Invoice line items
- Invoice status workflow (DRAFT → SENT → PAID → OVERDUE)
- Invoice PDF generation
- Payment tracking

### 3. Collections Module
- Outstanding balance tracking
- Payment promises (Promise-to-Pay)
- Collection reminders
- Payment history
- Aging reports (30/60/90 days)

### 4. Notifications Module
- Email notifications
- SMS notifications (future)
- WhatsApp integration (future)
- Notification templates
- Notification scheduling
- Delivery tracking

### 5. Dashboard Module
- KPI metrics (Outstanding, Overdue, Expected Inflow)
- Collection performance charts
- Top customers by outstanding
- Risk alerts
- Activity timeline

### 6. Analytics Module
- Payment trend analysis
- Collection efficiency metrics
- Customer behavior analytics
- Revenue forecasting
- Export reports (CSV, Excel, PDF)

## Database Schema (Additional Tables)

```sql
-- Customers (already designed in Phase 1 migration pattern)
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255),
    email CITEXT,
    phone VARCHAR(20),
    address TEXT,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_cycle INT DEFAULT 30,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    customer_id UUID REFERENCES customers(id),
    invoice_number VARCHAR(50) UNIQUE,
    invoice_date DATE,
    due_date DATE,
    subtotal DECIMAL(15,2),
    tax DECIMAL(15,2),
    total DECIMAL(15,2),
    amount_paid DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Invoice Items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id),
    description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    amount DECIMAL(15,2),
    created_at TIMESTAMPTZ
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    customer_id UUID REFERENCES customers(id),
    invoice_id UUID REFERENCES invoices(id),
    amount DECIMAL(15,2),
    payment_date DATE,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ
);

-- Payment Promises
CREATE TABLE payment_promises (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    customer_id UUID REFERENCES customers(id),
    invoice_id UUID REFERENCES invoices(id),
    promised_amount DECIMAL(15,2),
    promised_date DATE,
    status VARCHAR(20),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    customer_id UUID REFERENCES customers(id),
    type VARCHAR(50),
    channel VARCHAR(20),
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(20),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);

-- Dashboard Metrics Cache
CREATE TABLE dashboard_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    metric_date DATE,
    total_outstanding DECIMAL(15,2),
    total_overdue DECIMAL(15,2),
    expected_inflow_7d DECIMAL(15,2),
    expected_inflow_30d DECIMAL(15,2),
    collection_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ
);
```

## API Endpoints Structure

### Customers
- `POST   /api/v1/customers` - Create customer
- `GET    /api/v1/customers` - List customers (with pagination, search, filter)
- `GET    /api/v1/customers/:id` - Get customer details
- `PATCH  /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Soft delete customer
- `POST   /api/v1/customers/import` - Bulk import

### Invoices
- `POST   /api/v1/invoices` - Create invoice
- `GET    /api/v1/invoices` - List invoices
- `GET    /api/v1/invoices/:id` - Get invoice
- `PATCH  /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `POST   /api/v1/invoices/:id/send` - Send invoice to customer
- `GET    /api/v1/invoices/:id/pdf` - Download PDF

### Collections
- `GET    /api/v1/collections` - List overdue invoices
- `GET    /api/v1/collections/aging` - Aging report
- `POST   /api/v1/collections/promises` - Create payment promise
- `GET    /api/v1/collections/promises` - List promises
- `PATCH  /api/v1/collections/promises/:id` - Update promise

### Notifications
- `GET    /api/v1/notifications` - List notifications
- `POST   /api/v1/notifications` - Create notification
- `POST   /api/v1/notifications/:id/send` - Send now
- `GET    /api/v1/notifications/templates` - List templates

### Dashboard
- `GET    /api/v1/dashboard/kpis` - Get key metrics
- `GET    /api/v1/dashboard/charts` - Get chart data
- `GET    /api/v1/dashboard/alerts` - Get risk alerts
- `GET    /api/v1/dashboard/activity` - Recent activity

### Analytics
- `GET    /api/v1/analytics/payment-trends` - Payment trends
- `GET    /api/v1/analytics/collection-efficiency` - Efficiency metrics
- `GET    /api/v1/analytics/customer-behavior` - Behavior analytics
- `POST   /api/v1/analytics/export` - Export report

## Implementation Order

1. **Customers Module** (Foundation)
2. **Invoices Module** (Core functionality)
3. **Collections Module** (Collections features)
4. **Dashboard Module** (Aggregated views)
5. **Notifications Module** (Communication)
6. **Analytics Module** (Reporting)

## Ready to Start?

Run the following command when ready:

```bash
# Start Phase 2 implementation
npm run generate:phase2
```

This will scaffold all modules with:
- Controllers
- Services
- DTOs
- Database queries
- Swagger documentation
- Unit test templates
