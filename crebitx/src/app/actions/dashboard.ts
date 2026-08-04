"use server"

import { auth } from "@/auth"
import { api } from "@/lib/api"
import { apiWithAuthRetry } from "@/lib/server-api"

export async function getDashboardKPIs() {
  const session = await auth()
  if (!session) return null

  try {
    const response = await apiWithAuthRetry((headers) => api.get("/dashboard/kpis", { headers }))
    return response.data.data
  } catch (error) {
    console.error("Dashboard KPIs error:", error)
    return {
      outstandingAmount: 0,
      overdueAmount: 0,
      inflowAmount: 0,
      topCustomers: [],
      alerts: [],
    }
  }
}

export async function getDashboardCharts(months = 6) {
  const session = await auth()
  if (!session) return null

  try {
    const response = await apiWithAuthRetry((headers) => api.get(`/dashboard/charts?months=${months}`, { headers }))
    return response.data.data
  } catch (error) {
    console.error("Dashboard charts error:", error)
    return []
  }
}

export async function getDashboardActivity(limit = 20) {
  const session = await auth()
  if (!session) return null

  try {
    const response = await apiWithAuthRetry((headers) => api.get(`/dashboard/activity?limit=${limit}`, { headers }))
    return response.data.data
  } catch (error) {
    console.error("Dashboard activity error:", error)
    return []
  }
}

export async function getRecentActivity() {
  const session = await auth()
  if (!session) return []

  try {
    const response = await apiWithAuthRetry((headers) => api.get("/dashboard/activity?limit=20", { headers }))
    return response.data.data || []
  } catch (error) {
    console.error("Recent activity error:", error)
    return []
  }
}
