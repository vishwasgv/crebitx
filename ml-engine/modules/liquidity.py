from datetime import datetime, timedelta

def simulate_liquidity(predicted_inflows: list, expenses: list, starting_balance: float = 0.0) -> dict:
    """
    Simulates the 30-day cashflow utilizing predicted payment dates.
    predicted_inflows: list of dicts {"receivableItemId": str, "predictedPaidDate": datetime/str, "amount": float}
    expenses: list of dicts {"id": str, "dueDate": datetime/str, "amount": float}
    """
    
    events = []
    
    for inflow in predicted_inflows:
        dt = inflow["predictedPaidDate"] if isinstance(inflow["predictedPaidDate"], datetime) else datetime.fromisoformat(inflow["predictedPaidDate"])
        # Strip timezone info to ensure all datetimes are tz-naive.
        # datetime.fromisoformat() on a tz-aware ISO string (e.g. '2026-07-23T17:56:06+00:00')
        # returns a tz-aware object. Comparing it to tz-naive datetime.now() raises TypeError.
        dt = dt.replace(tzinfo=None)
        events.append({
            "date": dt,
            "type": "inflow",
            "amount": inflow["amount"]
        })
        
    for expense in expenses:
        dt = expense["dueDate"] if isinstance(expense["dueDate"], datetime) else datetime.fromisoformat(expense["dueDate"])
        dt = dt.replace(tzinfo=None)  # Same tz-naive enforcement
        events.append({
            "date": dt,
            "type": "outflow",
            "amount": expense["amount"]
        })
        
    events.sort(key=lambda x: x["date"])
    
    current_balance = starting_balance
    cash_shortage_risk = False
    shortage_date = None
    
    daily_balances = []
    predicted_inflow_30d = 0.0
    expected_expenses_30d = 0.0
    
    now = datetime.now()
    thirty_days_later = now + timedelta(days=30)
    
    for event in events:
        if event["type"] == "inflow":
            current_balance += event["amount"]
            if event["date"] <= thirty_days_later:
                predicted_inflow_30d += event["amount"]
        else:
            current_balance -= event["amount"]
            if event["date"] <= thirty_days_later:
                expected_expenses_30d += event["amount"]
                
        if current_balance < 0 and not cash_shortage_risk:
            cash_shortage_risk = True
            shortage_date = event["date"].isoformat()
            
        daily_balances.append({
            "date": event["date"].isoformat(),
            "inflow": event["amount"] if event["type"] == "inflow" else 0.0,
            "outflow": event["amount"] if event["type"] == "outflow" else 0.0,
            "balance": current_balance
        })

    return {
        "cashShortageRisk": cash_shortage_risk,
        "shortageDate": shortage_date,
        "dailyBalances": daily_balances,
        "predictedInflow_30d": predicted_inflow_30d,
        "expectedExpenses_30d": expected_expenses_30d
    }
