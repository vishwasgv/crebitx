import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/crebitx?schema=public")

def clear_db():
    conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL
    conn = psycopg2.connect(conn_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        print("Clearing customer-related data from lowercase tables...")
        # TRUNCATE customers CASCADE will clear receivable_items, payment_allocations, etc.
        cur.execute("TRUNCATE TABLE customers CASCADE;")
    conn.close()

def get_deterministic_uuid(name: str) -> str:
    # Generates a valid, deterministic UUID based on a string name
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, name))

def seed_test_case(tc_num, profile="GOOD"):
    conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL
    conn = psycopg2.connect(conn_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    t_id = get_deterministic_uuid(f"tenant_tc{tc_num}")
    c_id = get_deterministic_uuid(f"customer_tc{tc_num}")
    
    cur.execute(
        "INSERT INTO tenants (id, name, slug, status) VALUES (%s, %s, %s, 'ACTIVE') ON CONFLICT (id) DO NOTHING;",
        (t_id, f"Tenant {tc_num}", f"tenant-tc{tc_num}")
    )
    cur.execute(
        "INSERT INTO customers (id, tenant_id, name, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;",
        (c_id, t_id, f"Customer {c_id[:8]}")
    )
    
    # Insert credit profile to avoid DivisionByZero / default utilization checks
    profile_id = get_deterministic_uuid(f"profile_tc{tc_num}")
    cur.execute(
        "INSERT INTO customer_credit_profiles (id, customer_id, credit_limit, payment_cycle, grace_period, late_fee_percent, reminder_freq, updated_at) VALUES (%s, %s, 100000, 30, 7, 0, 7, NOW()) ON CONFLICT DO NOTHING;",
        (profile_id, c_id)
    )
    
    if profile == "EMPTY":
        cur.close()
        conn.close()
        return t_id, c_id
        
    now = datetime.now()
    # Generate 10 past invoices
    for j in range(10):
        r_id = get_deterministic_uuid(f"rec_{tc_num}_{j}")
        amount = 1000
        due_date = (now - timedelta(days=50 + j*10)).date()
        
        delay = -5 if profile == "GOOD" else 60
        payment_date = datetime.combine(due_date + timedelta(days=delay), datetime.min.time())
        
        cur.execute("""
            INSERT INTO receivable_items (id, customer_id, amount, description, due_date, is_paid, paid_amount, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, TRUE, %s, NOW(), NOW())
        """, (r_id, c_id, amount, f"Invoice {j}", due_date, amount))
        
        cur.execute("""
            INSERT INTO payment_allocations (id, receivable_item_id, amount, payment_date, created_at) 
            VALUES (%s, %s, %s, %s, NOW())
        """, (get_deterministic_uuid(f"pay_{tc_num}_{j}"), r_id, amount, payment_date))
        
        if profile == "STRUGGLING" and j % 2 == 0:
            promise_id = get_deterministic_uuid(f"prom_{tc_num}_{j}")
            promise_date = due_date + timedelta(days=15)
            cur.execute("""
                INSERT INTO payment_promises (id, customer_id, amount, promised_date, status, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, 'BROKEN', NOW(), NOW())
            """, (promise_id, c_id, amount, promise_date))
            
    # One unpaid invoice for timeline except for TC-05
    if profile != "NO_UNPAID":
        r_unpaid = get_deterministic_uuid(f"rec_unpaid_{tc_num}")
        due_date_unpaid = (now + timedelta(days=5)).date()
        cur.execute("""
            INSERT INTO receivable_items (id, customer_id, amount, description, due_date, is_paid, paid_amount, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, FALSE, 0, NOW(), NOW())
        """, (r_unpaid, c_id, 5000, "Unpaid Invoice", due_date_unpaid))

    cur.close()
    conn.close()
    return t_id, c_id

def test_api(tc_name, t_id, c_id):
    print(f"\nRunning {tc_name}...")
    try:
        resp = client.post("/api/ml/predict", json={"tenantId": t_id, "customerId": c_id}, headers={"X-API-Key": "crebitx-secret-key-for-dev"})
        if resp.status_code == 200:
            print(f"PASS: {tc_name}")
            data = resp.json()
            # print basic risk score details
            print("Risk Score:", data.get('risk_score'))
            print("Timeline Inflow Count:", len(data.get('timeline_predictions', [])))
        else:
            print(f"FAIL/INFO: {tc_name} returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    print("WARNING: This will clear customer data in the database to run edge cases.")
    clear_db()
    
    # TC-01: Cold Start (Assuming we delete models to test this properly)
    try:
        os.remove(os.path.join(os.path.dirname(__file__), "modules", "risk_model.joblib"))
        os.remove(os.path.join(os.path.dirname(__file__), "modules", "survival_model.joblib"))
    except FileNotFoundError:
        pass
        
    t1, c1 = seed_test_case("01", profile="GOOD")
    test_api("TC-01: Cold Start Validation", t1, c1)
    
    print("\n--- Training Models to resolve Cold Start ---")
    # We must seed variance so CatBoost doesn't crash from constant features
    for i in range(15): seed_test_case(f"train_g_{i}", profile="GOOD")
    for i in range(15): seed_test_case(f"train_e_{i}", profile="ERRATIC")
    for i in range(15): seed_test_case(f"train_s_{i}", profile="STRUGGLING")
    
    resp = client.post("/api/ml/train", json={}, headers={"X-API-Key": "crebitx-secret-key-for-dev"})
    print("Training Response:", resp.json())
    
    # TC-02: New Customer (Empty)
    t2, c2 = seed_test_case("02", profile="EMPTY")
    test_api("TC-02: Empty Customer", t2, c2)
    
    # TC-03: Good Payer
    t3, c3 = seed_test_case("03", profile="GOOD")
    test_api("TC-03: Good Payer", t3, c3)
    
    # TC-04: Struggling Payer
    t4, c4 = seed_test_case("04", profile="STRUGGLING")
    test_api("TC-04: Struggling Payer", t4, c4)
    
    # TC-05: Empty Unpaid Timeline
    t5, c5 = seed_test_case("05", profile="NO_UNPAID")
    test_api("TC-05: Empty Unpaid Timeline", t5, c5)
