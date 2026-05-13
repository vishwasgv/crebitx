-- Migration 002: Business Modules Tables
-- Description: Creates tables for customers, ledger, receivables, payments, risk scoring, settings

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

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_name ON customers(name);

-- Customer credit profiles
CREATE TABLE IF NOT EXISTS customer_credit_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_cycle INT DEFAULT 30,
    grace_period INT DEFAULT 0,
    late_fee_percent DECIMAL(5,2) DEFAULT 0,
    reminder_freq INT DEFAULT 7,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_profile_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_credit_profiles_customer_id ON customer_credit_profiles(customer_id);

-- Receivable items (invoices/dues)
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

CREATE INDEX idx_receivables_customer_id ON receivable_items(customer_id);
CREATE INDEX idx_receivables_due_date ON receivable_items(due_date);
CREATE INDEX idx_receivables_is_paid ON receivable_items(is_paid);

-- Payment allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_item_id UUID NOT NULL REFERENCES receivable_items(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_allocation_receivable FOREIGN KEY (receivable_item_id) REFERENCES receivable_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_allocations_receivable_id ON payment_allocations(receivable_item_id);
CREATE INDEX idx_allocations_payment_date ON payment_allocations(payment_date);

-- Ledger events (all transactions)
CREATE TABLE IF NOT EXISTS ledger_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    tag VARCHAR(20) NOT NULL CHECK (tag IN ('SALE', 'RETURN', 'ADJUSTMENT', 'PAYMENT')),
    note TEXT,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ledger_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_ledger_tenant_id ON ledger_events(tenant_id);
CREATE INDEX idx_ledger_customer_id ON ledger_events(customer_id);
CREATE INDEX idx_ledger_event_date ON ledger_events(event_date);
CREATE INDEX idx_ledger_tag ON ledger_events(tag);

-- Risk score snapshots
CREATE TABLE IF NOT EXISTS risk_score_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    level VARCHAR(10) NOT NULL CHECK (level IN ('GREEN', 'YELLOW', 'RED')),
    reason TEXT,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_risk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_customer_id ON risk_score_snapshots(customer_id);
CREATE INDEX idx_risk_snapshot_date ON risk_score_snapshots(snapshot_date);
CREATE INDEX idx_risk_level ON risk_score_snapshots(level);

-- Business configuration
CREATE TABLE IF NOT EXISTS business_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    default_cycle INT DEFAULT 30,
    default_grace INT DEFAULT 7,
    risk_weight_delay DECIMAL(3,2) DEFAULT 0.6,
    risk_weight_limit DECIMAL(3,2) DEFAULT 0.4,
    reminder_tone VARCHAR(20) DEFAULT 'FRIENDLY' CHECK (reminder_tone IN ('FRIENDLY', 'BALANCED', 'STRICT')),
    auto_approve_limit DECIMAL(15,2) DEFAULT 0,
    CONSTRAINT fk_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_config_tenant_id ON business_configs(tenant_id);

-- Reminder jobs
CREATE TABLE IF NOT EXISTS reminder_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    receivable_item_id UUID REFERENCES receivable_items(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    message TEXT,
    CONSTRAINT fk_reminder_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_reminders_customer_id ON reminder_jobs(customer_id);
CREATE INDEX idx_reminders_status ON reminder_jobs(status);
CREATE INDEX idx_reminders_scheduled_for ON reminder_jobs(scheduled_for);

-- Imports tracking
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    row_count INT DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_import_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_imports_tenant_id ON imports(tenant_id);
CREATE INDEX idx_imports_status ON imports(status);
CREATE INDEX idx_imports_created_at ON imports(created_at);

-- Update timestamp function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_profiles_updated_at BEFORE UPDATE ON customer_credit_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivable_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
