import os
import joblib
import shap
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.joblib")

def get_shap_explanations(features: dict) -> list:
    if not os.path.exists(MODEL_PATH):
        return []
        
    try:
        pipeline = joblib.load(MODEL_PATH)
        # Extract the underlying CalibratedClassifierCV -> StackingClassifier -> XGBoost base estimator
        # Using the base XGBoost estimator for fast TreeExplainer SHAP values (mathematical proxy)
        calibrated = pipeline.named_steps['model']
        # CalibratedClassifierCV wraps the estimator in calibrated_classifiers_
        stacking = calibrated.calibrated_classifiers_[0].estimator

        # FIX #2: Use name-based lookup instead of positional index.
        # If the estimator order ever changes in risk_scoring.py, index [0] would silently
        # point to the wrong model. named_estimators_ is always correct.
        xgb_model = stacking.named_estimators_['xgb']
        
        # Prepare the exact scaled features the model expects
        feature_cols = [
            "rolling_DSO_30", "rolling_DSO_90", "delay_growth_rate", "credit_utilisation_rate",
            "promise_kept_ratio", "broken_promise_count_30d", "anomaly_score", "payment_interval_entropy"
        ]
        
        feature_row = [
            features.get("rolling_DSO_30", 0),
            features.get("rolling_DSO_90", 0),
            features.get("delay_growth_rate", 0),
            features.get("credit_utilisation_rate", 0),
            features.get("promise_kept_ratio", 1.0),
            features.get("broken_promise_count_30d", 0),
            features.get("anomaly_score", 1.0),
            features.get("payment_interval_entropy", 0)
        ]
        
        df_input = pd.DataFrame([feature_row], columns=feature_cols)
        
        # Scale input using the pipeline's scaler
        imputer = pipeline.named_steps['imputer']
        scaler = pipeline.named_steps['scaler']
        scaled_input = scaler.transform(imputer.transform(df_input))
        
        explainer = shap.TreeExplainer(xgb_model)
        shap_values = explainer.shap_values(scaled_input)
        
        # FIX #1: Handle SHAP version compatibility.
        # Old shap + xgboost: returns a list [class0_array, class1_array].
        #   -> class1 is the positive/risk class, and [0] picks the first sample row.
        # New shap: returns a single ndarray of shape (samples, features) for class 1,
        #   or (samples, features, classes) for multi-output.
        if isinstance(shap_values, list):
            # Old API: list of per-class arrays -> pick class 1 (default/risk), row 0
            shap_vals_row = shap_values[1][0]
        elif hasattr(shap_values, 'shape') and len(shap_values.shape) == 3:
            # New API 3D: (samples, features, classes) -> class 1, row 0
            shap_vals_row = shap_values[0, :, 1]
        else:
            # New API 2D: (samples, features) for class 1 -> row 0
            shap_vals_row = shap_values[0]

        # Sort features by their SHAP impact on risk (descending)
        impacts = list(zip(feature_cols, shap_vals_row))
        impacts.sort(key=lambda x: x[1], reverse=True)
        
        explanations = []
        for feat, val in impacts[:2]:
            if val > 0.1: # Only include if mathematically significant
                reason = "Mathematical impact: High"
                if feat == "rolling_DSO_90": reason = f"Long-term DSO is mathematically driving risk up (SHAP: {val:.2f})"
                elif feat == "broken_promise_count_30d": reason = f"Recent broken promises heavily impacting score (SHAP: {val:.2f})"
                elif feat == "delay_growth_rate": reason = f"Payment delays are compounding (SHAP: {val:.2f})"
                elif feat == "anomaly_score": reason = f"Isolation Forest detected anomalous behavior (SHAP: {val:.2f})"
                else: reason = f"Model identified elevated risk from {feat} (SHAP: {val:.2f})"
                
                explanations.append({
                    "factor": feat,
                    "reason": reason,
                    "impact": "high" if val > 0.5 else "medium"
                })

        # FIX #3: Guarantee explanations for elevated risk customers.
        # If risk is YELLOW or RED but no single SHAP factor cleared the 0.1 threshold
        # (e.g. risk is driven by many small signals), return the top 2 anyway so the
        # UI never displays an empty reason list for a high-risk customer.
        risk_level = features.get("_risk_level", "GREEN")
        if not explanations and risk_level in ("YELLOW", "RED") and impacts:
            for feat, val in impacts[:2]:
                if val > 0:
                    reason = "Contributing factor to elevated risk"
                    if feat == "rolling_DSO_90": reason = f"Long-term DSO contributing to risk (SHAP: {val:.2f})"
                    elif feat == "broken_promise_count_30d": reason = f"Broken promises contributing to risk (SHAP: {val:.2f})"
                    elif feat == "delay_growth_rate": reason = f"Growing payment delays detected (SHAP: {val:.2f})"
                    elif feat == "anomaly_score": reason = f"Slightly anomalous payment behavior detected (SHAP: {val:.2f})"
                    elif feat == "credit_utilisation_rate": reason = f"Elevated credit utilisation noted (SHAP: {val:.2f})"
                    else: reason = f"Elevated risk from {feat} (SHAP: {val:.2f})"
                    explanations.append({
                        "factor": feat,
                        "reason": reason,
                        "impact": "low"
                    })
                
        if not explanations and features.get("rolling_DSO_30", 0) == 0 and features.get("rolling_DSO_90", 0) == 0:
            explanations.append({
                "factor": "history",
                "reason": "Customer lacks sufficient history to generate specific insights.",
                "impact": "low"
            })
            
        return explanations
    except Exception as e:
        print(f"SHAP explanation failed: {e}")
        return []

def generate_explanations(features: dict, risk_output: dict):
    if risk_output.get("level") == "GREEN":
        return []
    
    # Pass risk level into features so get_shap_explanations can use it for Fix #3
    features_with_level = {**features, "_risk_level": risk_output.get("level", "GREEN")}
    return get_shap_explanations(features_with_level)
