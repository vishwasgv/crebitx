-- Operating intelligence MVP tables for the missing feature layer.

CREATE TABLE IF NOT EXISTS daily_briefs (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    summary TEXT NOT NULL,
    money_at_risk NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    generated_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    UNIQUE(tenant_id, business_date)
);

CREATE TABLE IF NOT EXISTS daily_brief_items (
    id TEXT PRIMARY KEY,
    brief_id TEXT NOT NULL REFERENCES daily_briefs(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    priority INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'PENDING',
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommended_actions (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    action_type VARCHAR(40) NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    priority INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommended_action_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    action_type VARCHAR(40) NOT NULL,
    channel VARCHAR(30),
    tone VARCHAR(30),
    outcome_status VARCHAR(30) NOT NULL,
    response_hours INTEGER,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_decision_checks (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    requested_amount NUMERIC(12, 2) NOT NULL,
    recommendation VARCHAR(40) NOT NULL,
    reasons JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id TEXT NOT NULL REFERENCES credit_decision_checks(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    decision VARCHAR(30) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_wins (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    detail TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follow_up_compliance_snapshots (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    completion_rate NUMERIC(5, 2) DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    missed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS weekly_reviews (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, week_start)
);

CREATE TABLE IF NOT EXISTS weekly_review_findings (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES weekly_reviews(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    detail TEXT,
    severity VARCHAR(20) DEFAULT 'INFO'
);

CREATE TABLE IF NOT EXISTS weekly_rule_suggestions (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES weekly_reviews(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    detail TEXT,
    status VARCHAR(20) DEFAULT 'OPEN'
);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_tenant_date ON daily_briefs(tenant_id, business_date DESC);
CREATE INDEX IF NOT EXISTS idx_recommended_actions_tenant_status ON recommended_actions(tenant_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_collection_outcomes_customer ON collection_outcomes(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_decision_checks_customer ON credit_decision_checks(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_wins_tenant ON recovery_wins(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_tenant ON weekly_reviews(tenant_id, week_start DESC);
