-- =============================================
-- CREBITX Database - Seed Data
-- Phase 1: Initial Demo Data
-- =============================================

-- Seed Demo Tenant
INSERT INTO tenants (id, name, slug, industry, subscription_plan, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'CREBITX Demo Corp', 'demo-corp', 'Wholesale Distribution', 'PRO', 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440002', 'Test Industries', 'test-industries', 'Manufacturing', 'BASIC', 'ACTIVE');

-- Seed Demo Users
-- Password for all demo users: "Password123!"
-- Hash generated with bcrypt rounds=10
INSERT INTO users (id, email, phone, password_hash, first_name, last_name, is_email_verified, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'owner@democorp.com', '+919876543210', '$2b$10$rKvFJZXn7z.pqFZxFVZxXOwGxJLHGqZ1pGBGxhJLPbvPJqFWZxXZX', 'John', 'Doe', TRUE, 'ACTIVE'),
('660e8400-e29b-41d4-a716-446655440002', 'admin@democorp.com', '+919876543211', '$2b$10$rKvFJZXn7z.pqFZxFVZxXOwGxJLHGqZ1pGBGxhJLPbvPJqFWZxXZX', 'Jane', 'Smith', TRUE, 'ACTIVE'),
('660e8400-e29b-41d4-a716-446655440003', 'staff@democorp.com', '+919876543212', '$2b$10$rKvFJZXn7z.pqFZxFVZxXOwGxJLHGqZ1pGBGxhJLPbvPJqFWZxXZX', 'Bob', 'Wilson', TRUE, 'ACTIVE');

-- Map Users to Tenants with Roles
INSERT INTO tenant_users (tenant_id, user_id, role_id, status, joined_at) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM roles WHERE name = 'TENANT_OWNER'),
    'ACTIVE',
    CURRENT_TIMESTAMP;

INSERT INTO tenant_users (tenant_id, user_id, role_id, status, joined_at) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM roles WHERE name = 'TENANT_ADMIN'),
    'ACTIVE',
    CURRENT_TIMESTAMP;

INSERT INTO tenant_users (tenant_id, user_id, role_id, status, joined_at) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM roles WHERE name = 'STAFF'),
    'ACTIVE',
    CURRENT_TIMESTAMP;

-- Seed Sample Audit Log
INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata) VALUES
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'USER_LOGIN', 'USER', '660e8400-e29b-41d4-a716-446655440001', '{"source": "seed_data"}');

-- =============================================
-- END OF SEED DATA
-- =============================================
