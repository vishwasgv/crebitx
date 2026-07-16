from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
import uvicorn

app = FastAPI(title="CREBITX ML Engine")

import os
from pydantic import BaseModel
from modules.features import compute_all_features
from modules.risk_scoring import calculate_risk_score
from modules.timeline import predict_payment_dates
from modules.liquidity import simulate_liquidity
from modules.explainability import generate_explanations

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/crebitx?schema=public")
ML_API_KEY = os.getenv("ML_API_KEY", "crebitx-secret-key-for-dev")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == ML_API_KEY:
        return api_key
    raise HTTPException(status_code=403, detail="Could not validate API KEY")

class PredictRequest(BaseModel):
    tenantId: str
    customerId: str

class TrainRequest(BaseModel):
    pass

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/ml/predict")
def predict_customer(req: PredictRequest, api_key: str = Depends(get_api_key)):
    # 0. Cold Start Check
    from fastapi import HTTPException
    risk_model_path = os.path.join(os.path.dirname(__file__), "modules", "risk_model.joblib")
    timeline_model_path = os.path.join(os.path.dirname(__file__), "modules", "survival_model.joblib")
    if not os.path.exists(risk_model_path) or not os.path.exists(timeline_model_path):
        raise HTTPException(status_code=400, detail="Models are not trained yet. Call /api/ml/train first.")
        
    # Connect to Redis for caching
    import redis
    import json
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    cache = redis.from_url(redis_url)
    
    cache_key = f"features_{req.tenantId}_{req.customerId}"
    cached_feats = None
    try:
        cached_feats = cache.get(cache_key)
    except Exception as e:
        print(f"Redis cache error: {e}")
        
    if cached_feats:
        print(f"Cache HIT for {cache_key}")
        features = json.loads(cached_feats)
    else:
        print(f"Cache MISS for {cache_key}")
        # 1. Signal Refinery (extract features from PostgreSQL)
        features = compute_all_features(DATABASE_URL, req.tenantId, req.customerId)
        try:
            cache.setex(cache_key, 3600, json.dumps(features))
        except Exception:
            pass
    
    # 2. Predictive Brain
    risk_output = calculate_risk_score(features)
    
    # 3. Timeline Engine (fetch actual unpaid receivables from DB)
    import psycopg2
    from psycopg2.extras import RealDictCursor
    conn_url = DATABASE_URL.split('?')[0] if '?' in DATABASE_URL else DATABASE_URL
    conn = psycopg2.connect(conn_url, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT id, due_date as "dueDate", amount, paid_amount as "paidAmount" FROM receivable_items WHERE customer_id = %s AND is_paid = false', (req.customerId,))
            unpaid_db = cur.fetchall()
    finally:
        conn.close()
    
    unpaid = []
    total_expected_30d = 0.0
    for rec in unpaid_db:
        amt = float(rec['amount']) - float(rec['paidAmount'])
        if amt > 0:
            unpaid.append({
                "id": rec['id'],
                "dueDate": rec['dueDate'],
                "amount": amt
            })
            total_expected_30d += amt
    
    timeline_preds = predict_payment_dates(features, unpaid)
    
    # 4. Liquidity Simulation
    # Dynamic expected expenses proxy (10% of expected inflow for demo)
    from datetime import datetime, timedelta
    expenses = [{"id": "mock_exp_1", "dueDate": (datetime.now() + timedelta(days=10)).isoformat(), "amount": total_expected_30d * 0.1}]
    liquidity = simulate_liquidity(timeline_preds, expenses=expenses)
    # 5. Explainability Layer
    explanations = generate_explanations(features, risk_output)
    
    return {
        "features": features,
        "risk_score": risk_output,
        "timeline_predictions": timeline_preds,
        "liquidity_simulation": liquidity,
        "explanations": explanations
    }

@app.post("/api/ml/train")
def train_models(req: TrainRequest, api_key: str = Depends(get_api_key)):
    # Triggers the training loops (importing from test_features for MVP)
    import test_features
    test_features.train_models()
    return {"status": "success", "message": "Models retrained successfully."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
