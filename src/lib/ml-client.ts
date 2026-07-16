export interface MLPredictionResponse {
  features: any
  risk_score: {
    score: number
    level: "GREEN" | "YELLOW" | "RED"
    modelUsed: string
  }
  timeline_predictions: Array<{
    receivableItemId: string
    predictedPaidDate: string
    amount: number
  }>
  liquidity_simulation: {
    cashShortageRisk: boolean
    shortageDate: string | null
    dailyBalances: Array<{
      date: string
      inflow: number
      outflow: number
      balance: number
    }>
    predictedInflow_30d: number
    expectedExpenses_30d: number
  }
  explanations: Array<{
    factor: string
    reason: string
    impact: number
    value: string | number
  }>
}

export async function getMLIntelligence(tenantId: string, customerId: string): Promise<MLPredictionResponse | null> {
  try {
    const res = await fetch("http://localhost:8000/api/ml/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.ML_API_KEY || "crebitx-secret-key-for-dev",
      },
      body: JSON.stringify({ tenantId, customerId }),
      // we don't want Next.js to aggressively cache this during testing
      cache: "no-store", 
    })

    if (!res.ok) {
      console.error(`ML API Error: ${res.status} ${res.statusText}`)
      const text = await res.text()
      console.error(text)
      return null
    }

    const data = await res.json()
    return data as MLPredictionResponse
  } catch (error) {
    console.error("Failed to fetch from ML Engine:", error)
    return null
  }
}
