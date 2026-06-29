-- Migration 007: Customer activity timeline

CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    promise_date DATE,
    promise_amount DECIMAL(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_customer_activity_type CHECK (type IN ('CALL', 'MEETING', 'PROMISE_TO_PAY', 'NOTE'))
);

CREATE INDEX IF NOT EXISTS idx_customer_activities_customer ON customer_activities(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_activities_tenant ON customer_activities(tenant_id, created_at DESC);

CREATE TRIGGER update_customer_activities_updated_at BEFORE UPDATE ON customer_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
