/**
 * Frontend risk engine — delegates all scoring to the NestJS backend.
 * The backend auto-calculates risk on every ledger event.
 * This file provides a client-side helper for triggering a manual re-score
 * or reading the latest snapshot via the API.
 */

const API_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
    : "http://localhost:4000/api/v1"

/**
 * Fetch the latest risk snapshot for a customer from the backend.
 * The backend recalculates risk automatically on every ledger event.
 */
export async function getRiskSnapshot(
  customerId: string,
  accessToken: string
): Promise<{ score: number; level: "GREEN" | "YELLOW" | "RED"; reason?: string } | null> {
  try {
    const res = await fetch(`${API_URL}/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) return null

    const data = await res.json()
    const customer = data?.data || data

    return {
      score: customer?.riskScore ?? 100,
      level: customer?.riskLevel ?? "GREEN",
    }
  } catch (err) {
    console.error("getRiskSnapshot error:", err)
    return null
  }
}

/**
 * Local helper — compute a simple risk level from score without an API call.
 * Useful for optimistic UI updates.
 */
export function scoreToLevel(score: number): "GREEN" | "YELLOW" | "RED" {
  if (score < 40) return "RED"
  if (score < 75) return "YELLOW"
  return "GREEN"
}
