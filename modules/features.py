import math
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import scipy.stats

def get_db_connection(database_url: str):
    conn_url = database_url.split('?')[0] if '?' in database_url else database_url
    return psycopg2.connect(conn_url, cursor_factory=RealDictCursor)

def compute_temporal_features(conn, tenant_id: str, customer_id: str):
    query = """
        SELECT r.due_date as "dueDate", p.payment_date as "paymentDate", r.amount
        FROM payment_allocations p
        JOIN receivable_items r ON p.receivable_item_id = r.id
        WHERE r.customer_id = %s
        ORDER BY p.payment_date ASC
    """
    with conn.cursor() as cur:
        cur.execute(query, (customer_id,))
        payments = cur.fetchall()
        
    df = pd.DataFrame(payments)
    
    if df.empty:
        return {
            "rolling_DSO_30": 0.0,
            "rolling_DSO_90": 0.0,
            "delay_growth_rate": 0.0,
            "payment_variance": 0.0,
            "payment_interval_entropy": 0.0,
        }
        
    payment_dt = pd.to_datetime(df['paymentDate']).dt.tz_localize(None)
    due_dt = pd.to_datetime(df['dueDate']).dt.tz_localize(None)
    df['delay_days'] = (payment_dt - due_dt).dt.days
    df['delay_days'] = df['delay_days'].apply(lambda x: max(0, x))
    
    now = datetime.now()
    df_30 = df[payment_dt >= now - timedelta(days=30)]
    df_90 = df[payment_dt >= now - timedelta(days=90)]
    
    rolling_dso_30 = df_30['delay_days'].mean() if not df_30.empty else 0.0
    rolling_dso_90 = df_90['delay_days'].mean() if not df_90.empty else 0.0
    
    delay_growth_rate = 0.0
    if rolling_dso_90 > 0:
        delay_growth_rate = (rolling_dso_30 - rolling_dso_90) / rolling_dso_90
        
    payment_variance = df['delay_days'].std()
    if math.isnan(payment_variance):
        payment_variance = 0.0

    # Payment interval entropy
    df['payment_interval'] = payment_dt.diff().dt.days
    intervals = df['payment_interval'].dropna().tolist()
    if len(intervals) > 1:
        # compute entropy using scipy
        counts = pd.Series(intervals).value_counts()
        entropy = scipy.stats.entropy(counts)
    else:
        entropy = 0.0

    return {
        "rolling_DSO_30": float(rolling_dso_30) if not math.isnan(rolling_dso_30) else 0.0,
        "rolling_DSO_90": float(rolling_dso_90) if not math.isnan(rolling_dso_90) else 0.0,
        "delay_growth_rate": float(delay_growth_rate),
        "payment_variance": float(payment_variance),
        "payment_interval_entropy": float(entropy)
    }

def compute_credit_features(conn, tenant_id: str, customer_id: str):
    query_unpaid = """
        SELECT COALESCE(SUM(amount - paid_amount), 0) as unpaid_balance
        FROM receivable_items
        WHERE customer_id = %s AND is_paid = false
    """
    query_limit = """
        SELECT credit_limit as "creditLimit"
        FROM customer_credit_profiles
        WHERE customer_id = %s
    """
    
    with conn.cursor() as cur:
        cur.execute(query_unpaid, (customer_id,))
        unpaid = cur.fetchone()['unpaid_balance']
        
        cur.execute(query_limit, (customer_id,))
        limit_row = cur.fetchone()
        limit = limit_row['creditLimit'] if limit_row and limit_row['creditLimit'] > 0 else 1.0
        
    utilisation = float(unpaid) / float(limit) if float(limit) > 0 else 0.0
    return {"credit_utilisation_rate": float(utilisation)}

def compute_promise_features(conn, customer_id: str):
    # Query promises
    query = """
        SELECT pr.status, pr.promised_date as "promisedDate", pr.updated_at as "updatedAt", pr.fulfilled_at as "paymentDate"
        FROM payment_promises pr
        WHERE pr.customer_id = %s
    """
    try:
        with conn.cursor() as cur:
            cur.execute(query, (customer_id,))
            promises = cur.fetchall()
            
        if not promises:
            return {"promise_kept_ratio": 1.0, "broken_promise_count_30d": 0, "avg_promise_delay_days": 0.0}
            
        df = pd.DataFrame(promises)
        total = len(df)
        kept = len(df[df['status'] == 'KEPT'])
        
        now = datetime.now()
        broken_30d = len(df[(df['status'] == 'BROKEN') & (pd.to_datetime(df['updatedAt']).dt.tz_localize(None) >= now - timedelta(days=30))])
        
        # Calculate average delay of payments past the promised date
        avg_delay = 0.0
        df_broken = df[(df['status'] == 'BROKEN') & df['paymentDate'].notnull()]
        if not df_broken.empty:
            df_broken['delay'] = (pd.to_datetime(df_broken['paymentDate']).dt.tz_localize(None) - pd.to_datetime(df_broken['promisedDate']).dt.tz_localize(None)).dt.days
            avg_delay = df_broken['delay'].apply(lambda x: max(0, x)).mean()
        
        return {
            "promise_kept_ratio": float(kept / total),
            "broken_promise_count_30d": broken_30d,
            "avg_promise_delay_days": float(avg_delay) if not pd.isna(avg_delay) else 0.0
        }
    except psycopg2.errors.UndefinedTable:
        # Table not created yet, return defaults
        conn.rollback()
        return {"promise_kept_ratio": 1.0, "broken_promise_count_30d": 0, "avg_promise_delay_days": 0.0}

def compute_graph_features(conn, tenant_id: str, customer_id: str):
    # Proxy for node degree / centrality in the transaction graph
    query_degree = """
        SELECT COUNT(DISTINCT id) as node_degree
        FROM receivable_items
        WHERE customer_id = %s
    """
    
    with conn.cursor() as cur:
        cur.execute(query_degree, (customer_id,))
        res = cur.fetchone()
        node_degree = res['node_degree'] if res else 0
        
    return {
        "node_degree": float(node_degree),
        "customer_vendor_centrality": 1.0, # In this schema, customer belongs to 1 tenant
        "shared_vendor_overlap": 0.0 # Placeholder for full graph network query
    }

def compute_all_features(database_url: str, tenant_id: str, customer_id: str):
    conn = get_db_connection(database_url)
    try:
        temporal = compute_temporal_features(conn, tenant_id, customer_id)
        credit = compute_credit_features(conn, tenant_id, customer_id)
        promises = compute_promise_features(conn, customer_id)
        graph = compute_graph_features(conn, tenant_id, customer_id)
        
        # Isolation Forest - fit on historical data of this customer to find if their CURRENT behavior is an anomaly
        df_feats = pd.DataFrame([{
            "dso": temporal["rolling_DSO_30"],
            "var": temporal["payment_variance"],
            "growth": temporal["delay_growth_rate"]
        }])
        
        # Build baseline from entire tenant history
        query_baseline = """
            SELECT r.due_date as "dueDate", p.payment_date as "paymentDate"
            FROM payment_allocations p
            JOIN receivable_items r ON p.receivable_item_id = r.id
            JOIN customers c ON r.customer_id = c.id
            WHERE c.tenant_id = %s
        """
        try:
            with conn.cursor() as cur:
                cur.execute(query_baseline, (tenant_id,))
                all_payments = cur.fetchall()
            
            if all_payments:
                df_all = pd.DataFrame(all_payments)
                df_all['delay'] = (pd.to_datetime(df_all['paymentDate']).dt.tz_localize(None) - pd.to_datetime(df_all['dueDate']).dt.tz_localize(None)).dt.days
                baseline = pd.DataFrame({
                    "dso": df_all['delay'].rolling(30, min_periods=1).mean().fillna(0).values,
                    "var": df_all['delay'].rolling(30, min_periods=1).std().fillna(0).values,
                    "growth": [0.0] * len(df_all) # Simplified for baseline
                })
            else:
                baseline = pd.DataFrame({"dso": [0, 5], "var": [0, 1], "growth": [0, 0.05]})
        except Exception:
            baseline = pd.DataFrame({"dso": [0, 5], "var": [0, 1], "growth": [0, 0.05]})
            
        iso = IsolationForest(random_state=42)
        training_data = pd.concat([baseline.dropna(), df_feats], ignore_index=True)
        iso.fit(training_data)
        
        anomaly_score = iso.decision_function(df_feats)[0]

        behavior_shift = 1 if (temporal["rolling_DSO_30"] > temporal["rolling_DSO_90"] * 1.5) and (temporal["payment_variance"] > 30) else 0

        features = {
            "tenant_id": tenant_id,
            "customer_id": customer_id,
            **temporal,
            **credit,
            **promises,
            **graph,
            "anomaly_score": float(anomaly_score),
            "behavior_shift_flag": behavior_shift
        }
        return features
    finally:
        conn.close()
