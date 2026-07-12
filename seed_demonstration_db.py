import psycopg2
import uuid
from datetime import datetime, timedelta
import random
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/crebitx?schema=public")

def seed_db():
    conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL
    conn = psycopg2.connect(conn_url)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        print("Clearing old customer and transaction data...")
        # TRUNCATE customers CASCADE will clear customer_credit_profiles, receivable_items, 
        # payment_allocations, payment_promises, risk_score_snapshots, etc. due to foreign key constraints.
        cur.execute("TRUNCATE TABLE customers CASCADE;")
        
        # Use existing backend tenant IDs
        tenants = ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
        
        print("Generating 100 Customers and Thousands of Transactions in lowercase tables...")
        now = datetime.now()
        
        for tenant_id in tenants:
            # Ensure the tenant exists in the tenants table
            cur.execute(
                "INSERT INTO tenants (id, name, slug, industry, subscription_plan, status) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING;",
                (tenant_id, f"Tenant {tenant_id[:8]}", f"tenant-{tenant_id[:8]}", "Wholesale", "PRO", "ACTIVE")
            )
            
            for i in range(50):  # 50 customers per tenant
                customer_id = str(uuid.uuid4())
                customer_name = f"Demo Customer {i}"
                phone = f"+9199999999{i:02d}"
                email = f"customer{i}@demo.com"
                address = f"Address {i}, Street {i}"
                
                cur.execute(
                    "INSERT INTO customers (id, tenant_id, name, phone, email, address, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW());",
                    (customer_id, tenant_id, customer_name, phone, email, address)
                )
                
                credit_limit = random.choice([50000, 100000, 200000])
                profile_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO customer_credit_profiles (id, customer_id, credit_limit, payment_cycle, grace_period, late_fee_percent, reminder_freq, updated_at) VALUES (%s, %s, %s, 30, 7, 0, 7, NOW());",
                    (profile_id, customer_id, credit_limit)
                )

                # Determine customer profile
                profile = random.choice(["GOOD", "ERRATIC", "STRUGGLING"])
                
                # Generate 20 past invoices
                for j in range(20):
                    receivable_id = str(uuid.uuid4())
                    amount = random.randint(1000, 10000)
                    days_ago_due = random.randint(30, 365) # 1 year to 1 month ago
                    due_date = (now - timedelta(days=days_ago_due)).date()
                    
                    is_paid = True
                    delay = 0
                    if profile == "GOOD":
                        delay = random.choice([-5, 0, 2])
                    elif profile == "ERRATIC":
                        delay = random.choice([0, 15, 45, 90])
                    else: # STRUGGLING
                        delay = random.choice([30, 60, 120])
                        
                    payment_date = datetime.combine(due_date + timedelta(days=delay), datetime.min.time())
                    
                    # Some recent invoices might be unpaid
                    if payment_date > now:
                        is_paid = False
                        
                    cur.execute(
                        "INSERT INTO receivable_items (id, customer_id, amount, description, due_date, is_paid, paid_amount, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW());",
                        (receivable_id, customer_id, amount, f"Invoice {j}", due_date, is_paid, amount if is_paid else 0)
                    )
                    
                    if is_paid:
                        allocation_id = str(uuid.uuid4())
                        cur.execute(
                            "INSERT INTO payment_allocations (id, receivable_item_id, amount, payment_date, created_at) VALUES (%s, %s, %s, %s, NOW());",
                            (allocation_id, receivable_id, amount, payment_date)
                        )
                        
                    # Generate some payment promises for erratic/struggling
                    if delay > 30 and random.random() > 0.5:
                        status = 'BROKEN' if profile == "STRUGGLING" else 'KEPT'
                        promise_date = (due_date + timedelta(days=15))
                        promise_id = str(uuid.uuid4())
                        
                        cur.execute(
                            "INSERT INTO payment_promises (id, customer_id, amount, promised_date, status, note, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW());",
                            (promise_id, customer_id, amount, promise_date, status, "Promise note")
                        )

        print("Database successfully seeded with realistic historical data in lowercase tables.")

    except Exception as e:
        print(f"Error generating data: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed_db()
