"use server"

import { auth } from "@/auth"
import { api } from "@/lib/api"

export async function getDashboardKPIs() {
  const session = await auth()
  if (!session) return null

  try {
    const response = await api.get("/dashboard/kpis", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })
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
    const response = await api.get(`/dashboard/charts?months=${months}`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })
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
    const response = await api.get(`/dashboard/activity?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })
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
    const response = await api.get("/dashboard/activity?limit=20", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })
    return response.data.data || []
  } catch (error) {
    console.error("Recent activity error:", error)
    return []
  }
}
