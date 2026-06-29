"use server"

import { revalidatePath } from "next/cache"
import { api } from "@/lib/api"
import { apiWithAuthRetry } from "@/lib/server-api"

function unwrap<T>(payload: any, fallback: T): T {
  return (payload?.data?.data ?? payload?.data ?? fallback) as T
}

export async function getDailyBrief() {
  try {
    const response = await apiWithAuthRetry((headers) => api.get("/dashboard/daily-brief", { headers }))
    return unwrap<any | null>(response, null)
  } catch (error) {
    console.error("Daily brief error:", error)
    return null
  }
}

export async function completeDailyBriefItem(itemId: string) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.post(`/dashboard/daily-brief/${itemId}/complete-item`, {}, { headers })
    )
    revalidatePath("/actions")
    return { success: true, data: unwrap(response, {}) }
  } catch (error: any) {
    console.error("Complete daily brief item error:", error)
    return { error: error.message || "Failed to complete brief item" }
  }
}

export async function getNextBestActions(limit = 5) {
  try {
    const response = await apiWithAuthRetry((headers) => api.get(`/actions/next-best?limit=${limit}`, { headers }))
    return unwrap<any[]>(response, [])
  } catch (error) {
    console.error("Next-best actions error:", error)
    return []
  }
}

export async function recordRecommendedAction(
  actionId: string,
  status: "accept" | "postpone" | "dismiss",
  note?: string
) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.post(`/actions/${actionId}/${status}`, { note }, { headers })
    )
    revalidatePath("/actions")
    return { success: true, data: unwrap(response, {}) }
  } catch (error: any) {
    console.error("Record recommended action error:", error)
    return { error: error.message || "Failed to update action" }
  }
}

export async function getRecoveryWins() {
  try {
    const response = await apiWithAuthRetry((headers) => api.get("/dashboard/recovery-wins", { headers }))
    return unwrap<any[]>(response, [])
  } catch (error) {
    console.error("Recovery wins error:", error)
    return []
  }
}

export async function getDisciplineSummary() {
  try {
    const response = await apiWithAuthRetry((headers) => api.get("/discipline/summary", { headers }))
    return unwrap<any | null>(response, null)
  } catch (error) {
    console.error("Discipline summary error:", error)
    return null
  }
}

export async function getWeeklyReview() {
  try {
    const response = await apiWithAuthRetry((headers) => api.get("/reviews/weekly/current", { headers }))
    return unwrap<any | null>(response, null)
  } catch (error) {
    console.error("Weekly review error:", error)
    return null
  }
}

export async function applyWeeklySuggestion(reviewId: string, suggestionId: string) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.post(`/reviews/weekly/${reviewId}/apply-suggestion`, { suggestionId }, { headers })
    )
    revalidatePath("/weekly")
    return { success: true, data: unwrap(response, {}) }
  } catch (error: any) {
    console.error("Apply weekly suggestion error:", error)
    return { error: error.message || "Failed to apply suggestion" }
  }
}

export async function dismissWeeklySuggestion(reviewId: string, suggestionId: string) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.post(`/reviews/weekly/${reviewId}/dismiss-suggestion`, { suggestionId }, { headers })
    )
    revalidatePath("/weekly")
    return { success: true, data: unwrap(response, {}) }
  } catch (error: any) {
    console.error("Dismiss weekly suggestion error:", error)
    return { error: error.message || "Failed to dismiss suggestion" }
  }
}

export async function getCollectionPattern(customerId: string) {
  try {
    const response = await apiWithAuthRetry((headers) => api.get(`/customers/${customerId}/collection-patterns`, { headers }))
    return unwrap<any | null>(response, null)
  } catch (error) {
    console.error("Collection pattern error:", error)
    return null
  }
}

export async function runCreditCheck(customerId: string, amount: number) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.post("/credit/check", { customerId, amount }, { headers })
    )
    return { success: true, data: unwrap(response, null) }
  } catch (error: any) {
    console.error("Credit check error:", error)
    return { error: error.message || "Failed to run credit check" }
  }
}

export async function recordCollectionOutcome(data: {
  customerId: string
  channel: "CALL" | "WHATSAPP" | "SMS" | "EMAIL" | "VISIT"
  tone?: string
  outcomeStatus?: "SENT" | "RESPONDED" | "PROMISED" | "PAID" | "NO_RESPONSE" | "FAILED"
  amountRecovered?: number
  note?: string
}) {
  try {
    const response = await apiWithAuthRetry((headers) => api.post("/collection-outcomes", data, { headers }))
    revalidatePath(`/customers/${data.customerId}`)
    revalidatePath("/collections")
    return { success: true, data: unwrap(response, {}) }
  } catch (error: any) {
    console.error("Collection outcome error:", error)
    return { error: error.message || "Failed to record collection outcome" }
  }
}
