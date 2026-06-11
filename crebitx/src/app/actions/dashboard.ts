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
    console.error("Dashboard data error:", error)
    return {
      outstandingAmount: 0,
      overdueAmount: 0,
      inflowAmount: 0,
      topCustomers: [],
      alerts: [],
    }
  }
}

export async function getRecentActivity() {
  const session = await auth()
  if (!session) return []

  try {
    const response = await api.get("/dashboard/activity", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })
    return response.data.data || []
  } catch (error) {
    console.error("Dashboard activity error:", error)
    return []
  }
}

