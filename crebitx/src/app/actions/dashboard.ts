"use server"

import { auth } from "@/auth"
import { serverApi } from "@/lib/server-api"

const EMPTY_KPI = {
  outstandingAmount: 0,
  overdueAmount: 0,
  inflowAmount: 0,
  topCustomers: [],
  alerts: [],
}

export async function getDashboardKPIs() {
  const session = await auth()
  if (!session) return null

  try {
    const data = await serverApi.get<typeof EMPTY_KPI>("/dashboard/kpis", session.user.accessToken!)
    return data
  } catch {
    return EMPTY_KPI
  }
}
