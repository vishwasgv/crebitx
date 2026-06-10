-- Migration 005: Promise-to-Pay tracker

CREATE TABLE IF NOT EXISTS payment_promises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    promised_date DATE NOT NULL,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_promises_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_promise_status CHECK (status IN ('PENDING', 'KEPT', 'BROKEN', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS payment_promise_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_promise_id UUID NOT NULL REFERENCES payment_promises(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_promise_events_promise FOREIGN KEY (payment_promise_id) REFERENCES payment_promises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_promises_customer ON payment_promises(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_promises_status_date ON payment_promises(status, promised_date);
CREATE INDEX IF NOT EXISTS idx_payment_promise_events_promise ON payment_promise_events(payment_promise_id);

CREATE TRIGGER update_payment_promises_updated_at BEFORE UPDATE ON payment_promises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
