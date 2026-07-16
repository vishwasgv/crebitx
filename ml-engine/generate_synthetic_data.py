import psycopg2
from datetime import datetime, timedelta
import random
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/crebitx?schema=public")

def generate_synthetic_data():
    conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL
    conn = psycopg2.connect(conn_url)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        # Create a tenant
        cur.execute("INSERT INTO \"Tenant\" (id, name, \"updatedAt\") VALUES ('t1', 'Demo Tenant', NOW()) ON CONFLICT DO NOTHING;")
        
        # Create a customer
        cur.execute("INSERT INTO \"Customer\" (id, \"tenantId\", name, \"updatedAt\") VALUES ('c1', 't1', 'Acme Corp', NOW()) ON CONFLICT DO NOTHING;")
        
        # Create credit profile
        cur.execute("INSERT INTO \"CustomerCreditProfile\" (id, \"customerId\", \"creditLimit\", \"updatedAt\") VALUES ('cp1', 'c1', 100000, NOW()) ON CONFLICT DO NOTHING;")

        print("Generating Receivables and Payments for Customer c1...")
        
        now = datetime.now()
        
        # Generate 10 past invoices, some paid on time, some late
        for i in range(1, 11):
            rid = f"rec_{i}"
            amount = random.randint(1000, 5000)
            
            # Due date between 100 to 20 days ago
            days_ago_due = random.randint(20, 100)
            due_date = now - timedelta(days=days_ago_due)
            
            # Payment behavior: sometimes late
            delay = random.choice([0, 0, 5, 10, 35, 45])
            payment_date = due_date + timedelta(days=delay)
            
            cur.execute("""
                INSERT INTO "ReceivableItem" (id, "customerId", amount, "dueDate", "isPaid", "paidAmount", "updatedAt") 
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT DO NOTHING;
            """, (rid, 'c1', amount, due_date, True, amount))
            
            cur.execute("""
                INSERT INTO "PaymentAllocation" (id, "receivableItemId", amount, "paymentDate") 
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, (f"pay_{i}", rid, amount, payment_date))

        print("Synthetic data generated successfully.")

    except Exception as e:
        print(f"Error generating data: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    generate_synthetic_data()
