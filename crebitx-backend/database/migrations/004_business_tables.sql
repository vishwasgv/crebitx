-- Migration 004: Business Tables for Customers, Ledger, Collections
-- This migration creates all the business logic tables matching the frontend schema

-- ============================================================================
-- CUSTOMERS MODULE
-- ============================================================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_customer_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers(phone) WHERE deleted_at IS NULL;

-- Customer Credit Profiles
CREATE TABLE IF NOT EXISTS customer_credit_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_cycle INTEGER DEFAULT 30,
    grace_period INTEGER DEFAULT 0,
    late_fee_percent DECIMAL(5,2) DEFAULT 0,
    reminder_freq INTEGER DEFAULT 7,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_credit_profile_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_credit_profiles_customer ON customer_credit_profiles(customer_id);

-- ============================================================================
-- LEDGER & RECEIVABLES MODULE
-- ============================================================================

-- Ledger Events (Transaction History)
CREATE TABLE IF NOT EXISTS ledger_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    tag VARCHAR(20) NOT NULL DEFAULT 'SALE',
    note TEXT,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ledger_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT chk_ledger_tag CHECK (tag IN ('SALE', 'RETURN', 'ADJUSTMENT', 'PAYMENT'))
);

CREATE INDEX idx_ledger_tenant ON ledger_events(tenant_id);
CREATE INDEX idx_ledger_customer ON ledger_events(customer_id);
CREATE INDEX idx_ledger_date ON ledger_events(event_date DESC);

-- Receivable Items (Unpaid Invoices)
CREATE TABLE IF NOT EXISTS receivable_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_receivable_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_receivables_customer ON receivable_items(customer_id);
CREATE INDEX idx_receivables_due_date ON receivable_items(due_date);
CREATE INDEX idx_receivables_unpaid ON receivable_items(customer_id, is_paid, due_date) WHERE is_paid = FALSE;

-- Payment Allocations (Track which payments go to which receivables)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_item_id UUID NOT NULL REFERENCES receivable_items(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_receivable FOREIGN KEY (receivable_item_id) REFERENCES receivable_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_allocations_receivable ON payment_allocations(receivable_item_id);

-- ============================================================================
-- RISK SCORING MODULE
-- ============================================================================

-- Risk Score Snapshots
CREATE TABLE IF NOT EXISTS risk_score_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    level VARCHAR(10) NOT NULL DEFAULT 'GREEN',
    reason TEXT,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_risk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT chk_risk_level CHECK (level IN ('GREEN', 'YELLOW', 'RED')),
    CONSTRAINT chk_risk_score CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX idx_risk_snapshots_customer ON risk_score_snapshots(customer_id);
CREATE INDEX idx_risk_snapshots_date ON risk_score_snapshots(snapshot_date DESC);
CREATE INDEX idx_risk_snapshots_level ON risk_score_snapshots(level, snapshot_date DESC);

-- ============================================================================
-- REMINDERS & NOTIFICATIONS MODULE
-- ============================================================================

-- Reminder Jobs (Scheduled payment reminders)
CREATE TABLE IF NOT EXISTS reminder_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    receivable_item_id UUID REFERENCES receivable_items(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reminder_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_reminder_receivable FOREIGN KEY (receivable_item_id) REFERENCES receivable_items(id) ON DELETE SET NULL,
    CONSTRAINT chk_reminder_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED'))
);

CREATE INDEX idx_reminder_customer ON reminder_jobs(customer_id);
CREATE INDEX idx_reminder_scheduled ON reminder_jobs(scheduled_for) WHERE status = 'PENDING';
CREATE INDEX idx_reminder_status ON reminder_jobs(status, scheduled_for);

-- ============================================================================
-- IMPORT MODULE
-- ============================================================================

-- Bulk Imports
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PROCESSING',
    row_count INTEGER DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT fk_import_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_import_status CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_imports_tenant ON imports(tenant_id);
CREATE INDEX idx_imports_status ON imports(status, created_at DESC);

-- ============================================================================
-- BUSINESS CONFIGURATION MODULE
-- ============================================================================

-- Business Config (Settings per tenant)
CREATE TABLE IF NOT EXISTS business_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    default_cycle INTEGER DEFAULT 30,
    default_grace INTEGER DEFAULT 7,
    risk_weight_delay DECIMAL(3,2) DEFAULT 0.6,
    risk_weight_limit DECIMAL(3,2) DEFAULT 0.4,
    reminder_tone VARCHAR(20) DEFAULT 'FRIENDLY',
    auto_approve_limit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_reminder_tone CHECK (reminder_tone IN ('FRIENDLY', 'BALANCED', 'STRICT'))
);

CREATE INDEX idx_business_configs_tenant ON business_configs(tenant_id);

-- ============================================================================
-- SUBSCRIPTION MODULE
-- ============================================================================

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    plan VARCHAR(20) DEFAULT 'FREE',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    razorpay_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_subscription_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_subscription_plan CHECK (plan IN ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE')),
    CONSTRAINT chk_subscription_status CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'))
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_profiles_updated_at BEFORE UPDATE ON customer_credit_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivable_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_configs_updated_at BEFORE UPDATE ON business_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DEFAULT BUSINESS CONFIG FOR EXISTING TENANTS
-- ============================================================================

INSERT INTO business_configs (tenant_id, default_cycle, default_grace, risk_weight_delay, risk_weight_limit, reminder_tone, auto_approve_limit)
SELECT id, 30, 7, 0.6, 0.4, 'FRIENDLY', 0
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM business_configs)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- ANALYTICS HELPER VIEWS
-- ============================================================================

-- View: Customer Outstanding Balance
CREATE OR REPLACE VIEW customer_outstanding_view AS
SELECT 
    c.id AS customer_id,
    c.tenant_id,
    c.name AS customer_name,
    c.phone,
    c.email,
    COALESCE(SUM(r.amount - r.paid_amount), 0) AS outstanding_balance,
    COUNT(CASE WHEN r.is_paid = FALSE AND r.due_date < CURRENT_DATE THEN 1 END) AS overdue_count,
    COALESCE(SUM(CASE WHEN r.is_paid = FALSE AND r.due_date < CURRENT_DATE THEN r.amount - r.paid_amount ELSE 0 END), 0) AS overdue_amount
FROM customers c
LEFT JOIN receivable_items r ON c.id = r.customer_id AND r.is_paid = FALSE
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.tenant_id, c.name, c.phone, c.email;

COMMENT ON VIEW customer_outstanding_view IS 'Aggregated view of customer outstanding and overdue amounts';
