"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { api } from "@/lib/api"
import { apiWithAuthRetry } from "@/lib/server-api"

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  creditLimit: z.number().default(0),
  paymentCycle: z.number().default(30),
  gracePeriod: z.number().default(0),
})

export async function createCustomer(formData: z.infer<typeof customerSchema>) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const parsed = customerSchema.safeParse(formData)
  if (!parsed.success) return { error: "Invalid inputs" }

  const { name, phone, email, address, creditLimit, paymentCycle, gracePeriod } = parsed.data

  try {
    const response = await api.post(
      "/customers",
      {
        name,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        creditLimit,
        paymentCycle,
        gracePeriod,
      },
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    )

    revalidatePath("/customers")
    return { success: true, customer: response.data.data }
  } catch (error: any) {
    console.error("Create customer error:", error)
    return { error: error.message || "Failed to create customer" }
  }
}

export async function getCustomers() {
  const session = await auth()
  if (!session) return []

  try {
    const response = await apiWithAuthRetry((headers) =>
      api.get("/customers", { headers })
    )

    const payload = response.data?.data || response.data
    const customersList = payload?.data || payload || []

    return customersList.map((c: any) => {
      const outstanding = c.outstandingBalance || 0
      const creditLimit = c.creditProfile?.creditLimit || 100000
      const utilization = creditLimit > 0 ? outstanding / creditLimit : 0
      const heuristicLevel = utilization > 0.8 ? "RED" : utilization > 0.5 ? "YELLOW" : "GREEN"
      const heuristicScore = Math.max(0, Math.round((1 - utilization) * 100))

      return {
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        address: c.address || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        creditProfile: c.creditProfile,
        receivables: [
          {
            amount: outstanding,
            paidAmount: 0,
            isPaid: false,
          },
        ],
        riskSnapshots: [
          {
            level: c.riskLevel || heuristicLevel,
            score: c.riskScore ?? heuristicScore,
          },
        ],
      }
    })
  } catch (error: any) {
    console.error("Get customers error:", error.response?.data || error.message || error)
    return []
  }
}

export async function getCustomerById(id: string) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.get(`/customers/${id}`, { headers })
    )

    const c = response.data?.data || response.data
    if (!c) return null

    return {
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      creditProfile: c.creditProfile,
      receivables: (c.receivables || []).map((r: any) => ({
        id: r.id,
        amount: r.amount,
        paidAmount: r.paidAmount,
        dueDate: r.dueDate,
      })),
      ledgerEvents: (c.ledgerEvents || []).map((l: any) => ({
        id: l.id,
        amount: l.amount,
        tag: l.tag,
        note: l.note,
        eventDate: l.eventDate,
      })),
      activities: (c.activities || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        promiseDate: a.promiseDate,
        promiseAmount: a.promiseAmount,
        createdAt: a.createdAt,
      })),
      paymentPromises: (c.paymentPromises || []).map((promise: any) => ({
        id: promise.id,
        amount: promise.amount,
        promisedDate: promise.promisedDate,
        note: promise.note,
        status: promise.status,
        fulfilledAt: promise.fulfilledAt,
        createdAt: promise.createdAt,
      })),
      riskSnapshots: c.riskSnapshot
        ? [
          {
            level: c.riskSnapshot.level || "GREEN",
            score: c.riskSnapshot.score || 100,
          },
        ]
        : [],
    }
  } catch (error) {
    console.error("Get customer by id error:", error)
    return null
  }
}

export async function addLedgerEntry(data: {
  customerId: string
  amount: number
  tag: "SALE" | "RETURN" | "ADJUSTMENT" | "PAYMENT"
  note?: string
}) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    const response = await api.post("/customers/ledger", data, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })

    revalidatePath(`/customers/${data.customerId}`)
    revalidatePath("/dashboard")
    return { success: true, ledgerEntry: response.data.data }
  } catch (error: any) {
    console.error("Ledger entry error:", error)
    return { error: error.message || "Failed to add ledger entry" }
  }
}

export async function addActivity(data: {
  customerId: string
  type: string
  description: string
  promiseDate?: string
  promiseAmount?: number
}) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    if (data.type === "PROMISE_TO_PAY") {
      const response = await api.post(
        `/customers/${data.customerId}/payment-promises`,
        {
          amount: data.promiseAmount,
          promisedDate: data.promiseDate,
          note: data.description,
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        }
      )

      revalidatePath(`/customers/${data.customerId}`)
      revalidatePath("/dashboard")
      return { success: true, paymentPromise: response.data.data }
    }

    const response = await api.post(`/customers/${data.customerId}/activities`, data, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })

    revalidatePath(`/customers/${data.customerId}`)
    return { success: true, activity: response.data.data }
  } catch (error: any) {
    console.error("Activity entry error:", error)
    return { error: error.message || "Failed to add activity" }
  }
}

export async function markPaymentPromiseKept(id: string, customerId: string) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    const response = await api.post(
      `/customers/payment-promises/${id}/mark-kept`,
      {},
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    )

    revalidatePath(`/customers/${customerId}`)
    revalidatePath("/dashboard")
    return { success: true, promise: response.data.data }
  } catch (error: any) {
    console.error("Mark payment promise kept error:", error)
    return { error: error.message || "Failed to mark promise as kept" }
  }
}

export async function markPaymentPromiseBroken(id: string, customerId: string) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    const response = await api.post(
      `/customers/payment-promises/${id}/mark-broken`,
      {},
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    )

    revalidatePath(`/customers/${customerId}`)
    revalidatePath("/dashboard")
    return { success: true, promise: response.data.data }
  } catch (error: any) {
    console.error("Mark payment promise broken error:", error)
    return { error: error.message || "Failed to mark promise as broken" }
  }
}
export async function getCustomerMLIntelligence(id: string) {
  try {
    const response = await apiWithAuthRetry((headers) =>
      api.get(`/customers/${id}/ml-intelligence`, { headers })
    )
    // Backend returns { success, data: { success, data: { features, risk_score, ... } } }
    // We need to unwrap to the innermost data object
    const outer = response.data?.data
    const mlPayload = outer?.data || outer
    return mlPayload || null
  } catch (error) {
    console.error("Get customer ML intelligence error:", error)
    return null
  }
}
