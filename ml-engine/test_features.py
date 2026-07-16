import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor
import psycopg2
from modules.features import compute_all_features
from modules.risk_scoring import calculate_risk_score, train_risk_model
from modules.timeline import predict_payment_dates, train_timeline_model

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/crebitx?schema=public")

def fetch_training_data():
    conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL
    conn = psycopg2.connect(conn_url, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    cur.execute('SELECT id, tenant_id as "tenantId" FROM customers')
    customers = cur.fetchall()
    
    X_list = []
    y_list = []
    survival_list = []
    
    print(f"Extracting features for {len(customers)} customers from DB...")
    
    for c in customers:
        feats = compute_all_features(DATABASE_URL, c['tenantId'], c['id'])
        
        # Risk Model Labeling: Use a composite metric so the model learns a blend of features
        # rather than memorizing a single threshold.
        risk_metric = (feats.get("rolling_DSO_90", 0) / 30.0) + \
                      feats.get("credit_utilisation_rate", 0) + \
                      (feats.get("broken_promise_count_30d", 0) * 0.5) + \
                      (1.0 - feats.get("promise_kept_ratio", 1.0))
        label = 1 if risk_metric > 1.5 else 0
        
        feature_row = [
            feats.get("rolling_DSO_30", 0),
            feats.get("rolling_DSO_90", 0),
            feats.get("delay_growth_rate", 0),
            feats.get("credit_utilisation_rate", 0),
            feats.get("promise_kept_ratio", 1.0),
            feats.get("broken_promise_count_30d", 0),
            feats.get("anomaly_score", 1.0),
            feats.get("payment_interval_entropy", 0)
        ]
        X_list.append(feature_row)
        y_list.append(label)
        
        # Survival Model Data (using average behavior for this proxy training)
        duration = feats["rolling_DSO_90"] if feats["rolling_DSO_90"] > 0 else 5
        event = 1 # We assume all historical are paid for survival base
        survival_list.append([
            feats.get("rolling_DSO_30", 0),
            feats.get("anomaly_score", 1.0),
            feats.get("broken_promise_count_30d", 0),
            duration,
            event
        ])
        
    conn.close()
    
    X_risk = pd.DataFrame(X_list, columns=[
        "rolling_DSO_30", "rolling_DSO_90", "delay_growth_rate", "credit_utilisation_rate",
        "promise_kept_ratio", "broken_promise_count_30d", "anomaly_score", "payment_interval_entropy"
    ])
    y_risk = pd.Series(y_list)
    
    df_survival = pd.DataFrame(survival_list, columns=[
        "rolling_DSO_30", "anomaly_score", "broken_promise_count_30d", "duration", "event"
    ])
    
    return X_risk, y_risk, df_survival

def train_models():
    X_risk, y_risk, df_survival = fetch_training_data()
    
    print("Training Risk Scoring Model (Stacked Ensemble)...")
    train_risk_model(X_risk, y_risk)
    
    print("Training Timeline Model (Survival Analysis)...")
    train_timeline_model(df_survival)

if __name__ == "__main__":
    train_models()

    # Test Module 1
    features = compute_all_features(DATABASE_URL, '550e8400-e29b-41d4-a716-446655440001', '6d94014a-7070-4e2b-b958-3d3c8b3123da')
    print("--- Module 1: Features ---")
    print(json.dumps(features, indent=2))
    
    # Test Module 2
    risk = calculate_risk_score(features)
    print("\n--- Module 2: Risk Score ---")
    print(json.dumps(risk, indent=2))
    
    # Test Module 3
    # Mocking some unpaid receivables for the timeline engine
    now = datetime.now()
    unpaid = [
        {"id": "rec_unpaid_1", "dueDate": now, "amount": 25000},
        {"id": "rec_unpaid_2", "dueDate": now, "amount": 10000}
    ]
    predictions = predict_payment_dates(features, unpaid)
    print("\n--- Module 3: Timeline Predictions ---")
    print(json.dumps(predictions, indent=2))
    
    # Test Module 4
    from modules.liquidity import simulate_liquidity
    expenses = [{"id": "exp_1", "dueDate": now + timedelta(days=10), "amount": 10000}]
    liquidity = simulate_liquidity(predictions, expenses, starting_balance=5000)
    print("\n--- Module 4: Liquidity Simulation ---")
    print(json.dumps(liquidity, indent=2))
    
    # Test Module 5
    from modules.explainability import generate_explanations
    explanations = generate_explanations(features, risk)
    print("\n--- Module 5: Explainability Layer ---")
    print(json.dumps(explanations, indent=2))
