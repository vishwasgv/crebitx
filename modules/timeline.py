import os
import joblib
import pandas as pd
from datetime import datetime, timedelta
from lifelines import CoxPHFitter
from sklearn.model_selection import train_test_split

MODEL_PATH = os.path.join(os.path.dirname(__file__), "survival_model.joblib")

def train_timeline_model(df):
    """
    Trains the Timeline Engine using Survival Modelling (Cox Proportional Hazards).
    df: DataFrame containing:
      - features used for prediction (DSO, anomaly_score, etc.)
      - 'duration': time in days until payment
      - 'event': 1 if paid, 0 if censored (unpaid)
    """
    # Scale features (excluding duration and event)
    feature_cols = [c for c in df.columns if c not in ('duration', 'event')]
    
    # Train test split
    df_train, df_test = train_test_split(df, test_size=0.2, random_state=42)
    
    try:
        cph = CoxPHFitter(penalizer=0.1)
        # CoxPH works better if data is normalized
        cph.fit(df_train, duration_col='duration', event_col='event', show_progress=False)
        
        # Evaluate
        c_index = cph.score(df_test, scoring_method="concordance_index")
        print(f"[Timeline Model] Evaluated on Test Set -> Concordance Index: {c_index:.4f}")
        
        joblib.dump(cph, MODEL_PATH)
        return cph
    except Exception as e:
        print(f"[Timeline Model] WARNING: Training failed ({e}). Falling back to default baseline model.")
        return None

def load_timeline_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def predict_payment_dates(features: dict, unpaid_receivables: list) -> list:
    """
    Predicts the actual paid date for unpaid invoices using Survival Modelling.
    unpaid_receivables: list of dicts with {"id": str, "dueDate": datetime}
    """
    model = load_timeline_model()
    
    feature_dict = {
        "rolling_DSO_30": [features.get("rolling_DSO_30", 0)],
        "anomaly_score": [features.get("anomaly_score", 1.0)],
        "broken_promise_count_30d": [features.get("broken_promise_count_30d", 0)]
    }
    
    X_infer = pd.DataFrame(feature_dict)
    
    if model is None:
        # Fallback if model not trained
        expected_delay_days = 15
    else:
        # Predict expected median survival time (delay)
        survival_function = model.predict_survival_function(X_infer)
        
        # Find the day where survival probability drops below 0.5 (median time-to-event)
        # If it doesn't drop below 0.5 in the tracked timeline, we take the max time
        median_time = survival_function[survival_function.iloc[:, 0] <= 0.5].index.min()
        if pd.isna(median_time):
            median_time = survival_function.index.max()
            
        expected_delay_days = int(median_time)
    
    predictions = []
    for rec in unpaid_receivables:
        predicted_date = rec["dueDate"] + timedelta(days=expected_delay_days)
        predictions.append({
            "receivableItemId": rec["id"],
            "predictedPaidDate": predicted_date.isoformat(),
            "amount": rec.get("amount", 0)
        })
        
    return predictions
