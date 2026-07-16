import os
import joblib
import pandas as pd
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, log_loss

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.joblib")

def train_risk_model(X, y):
    """
    Trains the Stacked Ensemble Risk Model on historical ledger data.
    X: pandas DataFrame of features
    y: pandas Series of binary labels (1 = delayed/default, 0 = paid on time)
    """
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 1. Base Model Ensemble
    estimators = [
        ('xgb', XGBClassifier(n_estimators=100, max_depth=3, eval_metric='logloss')),
        ('lgb', LGBMClassifier(n_estimators=100, max_depth=3, verbose=-1)),
        ('cat', CatBoostClassifier(iterations=100, depth=3, verbose=0)),
        ('mlp', MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=500, early_stopping=True))
    ]
    
    # 2. Out-of-Fold Stacking Layer + Meta-Learner
    stacking_clf = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(),
        cv=5,
        n_jobs=-1
    )
    
    # 3. Calibration (Isotonic Regression)
    calibrated_clf = CalibratedClassifierCV(stacking_clf, method='isotonic', cv=3)
    
    # Preprocessing Pipeline
    pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler()),
        ('model', calibrated_clf)
    ])
    
    try:
        pipeline.fit(X_train, y_train)
    except Exception as e:
        print(f"[Risk Model] WARNING: Training failed ({e}). This usually means only one class in labels. Returning None.")
        return None
    
    # Evaluation Metrics
    y_pred_proba = pipeline.predict_proba(X_test)[:, 1]
    
    # Only calculate if there's multiple classes in y_test (synthetic data may only have 1 class)
    if len(set(y_test)) > 1:
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        loss = log_loss(y_test, y_pred_proba)
        print(f"[Risk Model] Evaluated on Test Set -> ROC-AUC: {roc_auc:.4f}, Log-Loss: {loss:.4f}")
    
    # Save model artifact
    joblib.dump(pipeline, MODEL_PATH)
        
    return pipeline

def load_risk_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def calculate_risk_score(features: dict) -> dict:
    """
    Produces a nuanced risk score by blending:
      1. ML model probability (if available)
      2. Multi-signal heuristic based on financial features
    This prevents extreme 0/100 outputs from overfitted models.
    """
    model = load_risk_model()
    
    # Feature vector matching training
    feature_vector = [
        features.get("rolling_DSO_30", 0),
        features.get("rolling_DSO_90", 0),
        features.get("delay_growth_rate", 0),
        features.get("credit_utilisation_rate", 0),
        features.get("promise_kept_ratio", 1.0),
        features.get("broken_promise_count_30d", 0),
        features.get("anomaly_score", 1.0),
        features.get("payment_interval_entropy", 0)
    ]
    
    columns = [
        "rolling_DSO_30", "rolling_DSO_90", "delay_growth_rate", "credit_utilisation_rate",
        "promise_kept_ratio", "broken_promise_count_30d", "anomaly_score", "payment_interval_entropy"
    ]
    X_infer = pd.DataFrame([feature_vector], columns=columns)
    
    if model is None:
        ml_prob = 0.5
    else:
        ml_prob = model.predict_proba(X_infer)[0][1]
        
    # Multi-signal heuristic to force variance
    # 1. Utilisation heavily drives risk (0.0 to 1.0) -> scaled up to 30 risk points
    util_risk = min(features.get("credit_utilisation_rate", 0), 1.0) * 30
    
    # 2. Broken promises drive risk (1 - ratio) -> scaled up to 30 risk points
    promise_risk = (1.0 - features.get("promise_kept_ratio", 1.0)) * 30
    
    # 3. DSO (Days Sales Outstanding) -> capped at 30 days = 30 risk points
    dso_risk = min(features.get("rolling_DSO_30", 0), 30)

    # 4. Currently overdue & unpaid receivables -> up to 40 risk points.
    # This is the strongest single signal (a customer sitting on unpaid,
    # past-due debt right now) and is intentionally weighted higher than
    # rolling DSO, which only reflects delay on invoices already settled.
    days_overdue = features.get("max_days_overdue", 0)
    if days_overdue > 30:
        overdue_risk = 40
    elif days_overdue > 7:
        overdue_risk = 20
    elif days_overdue > 0:
        overdue_risk = 5
    else:
        overdue_risk = 0

    # Calculate heuristic score (0 to 100+ scale, clamped below)
    heuristic_score = util_risk + promise_risk + dso_risk + overdue_risk
    
    # Blend ML model (which is heavily 0/1) with the heuristic (which is continuous)
    # We weight the ML model 40% and the heuristic 60% to ensure smooth continuous values
    blended_score = (ml_prob * 100 * 0.4) + (heuristic_score * 0.6)
    
    score = int(blended_score)
    
    # Prevent absolute 0 or 100 in production to reflect inherent uncertainty
    score = max(5, min(95, score))
    
    if score >= 65:
        level = "RED"
    elif score >= 35:
        level = "YELLOW"
    else:
        level = "GREEN"

    # Floor: a customer with a genuinely overdue, unpaid receivable can't be
    # shown as GREEN just because the pretrained model (which never saw
    # max_days_overdue during training) is confident based on their other,
    # otherwise-clean signals. Mirrors the >30-day / >7-day critical rule
    # already used by the non-ML fallback in risk-engine.service.ts, so the
    # two engines agree on the obvious cases instead of contradicting each other.
    if days_overdue > 30:
        level = "RED"
        score = max(score, 65)
    elif days_overdue > 7 and level == "GREEN":
        level = "YELLOW"
        score = max(score, 35)

    return {
        "score": score,
        "level": level,
        "modelUsed": "Stacked Ensemble (Heuristic Blend)"
    }

