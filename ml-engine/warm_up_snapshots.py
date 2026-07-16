import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Ensure we can import the modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.features import compute_all_features
from modules.risk_scoring import calculate_risk_score
from modules.explainability import generate_explanations

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/crebitx?schema=public")
conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL

def warm_up():
    print("Connecting to database...")
    conn = psycopg2.connect(conn_url)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        print("Clearing old snapshots...")
        cur.execute("TRUNCATE TABLE risk_score_snapshots CASCADE;")
        
        cur.execute("SELECT id, tenant_id, name FROM customers")
        customers = cur.fetchall()
        
        print(f"Warming up risk score snapshots for {len(customers)} customers using ML models...")
        for idx, cust in enumerate(customers):
            cust_id = cust['id']
            tenant_id = cust['tenant_id']
            name = cust['name']
            
            # 1. Extract signals
            features = compute_all_features(DATABASE_URL, tenant_id, cust_id)
            
            # 2. Predict risk
            risk = calculate_risk_score(features)
            
            # 3. Get explainability explanations
            exps = generate_explanations(features, risk)
            reason = 'AI Risk Prediction'
            if exps:
                reason = ' | '.join([e['reason'] for e in exps])
                
            # 4. Save snapshot in database
            cur.execute(
                "INSERT INTO risk_score_snapshots (customer_id, score, level, reason, snapshot_date) VALUES (%s, %s, %s, %s, NOW())",
                (cust_id, risk['score'], risk['level'], reason)
            )
            print(f"[{idx+1}/{len(customers)}] Customer: {name} -> Risk Score: {risk['score']} ({risk['level']})")

        print("\nAll database risk snapshots successfully synchronized with ML models!")
    except Exception as e:
        print("Error during warm up:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    warm_up()
