"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { serverApi } from "@/lib/server-api"

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
    const customer = await serverApi.post("/customers", session.user.accessToken!, {
      name,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      creditLimit,
      paymentCycle,
      gracePeriod,
    })

    revalidatePath("/customers")
    return { success: true, customer }
  } catch (error: any) {
    return { error: error.message || "Failed to create customer" }
  }
}

export async function getCustomers() {
  const session = await auth()
  if (!session) return []

  try {
    const payload: any = await serverApi.get("/customers", session.user.accessToken!)
    const customersList: any[] = payload?.data || payload || []

    return customersList.map((c: any) => ({
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
          amount: c.outstandingBalance || 0,
          paidAmount: 0,
          isPaid: false,
        },
      ],
      riskSnapshots: [
        {
          level: c.riskLevel || "GREEN",
          score: c.riskScore || 100,
        },
      ],
    }))
  } catch {
    return []
  }
}

export async function getCustomerById(id: string) {
  const session = await auth()
  if (!session) return null

  try {
    const c: any = await serverApi.get(`/customers/${id}`, session.user.accessToken!)
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
      riskSnapshots: c.riskSnapshot
        ? [
            {
              level: c.riskSnapshot.level || "GREEN",
              score: c.riskSnapshot.score || 100,
            },
          ]
        : [],
    }
  } catch {
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
    const ledgerEntry = await serverApi.post("/customers/ledger", session.user.accessToken!, data)
    revalidatePath(`/customers/${data.customerId}`)
    revalidatePath("/dashboard")
    return { success: true, ledgerEntry }
  } catch (error: any) {
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
    const activity = await serverApi.post(
      `/customers/${data.customerId}/activities`,
      session.user.accessToken!,
      data
    )
    revalidatePath(`/customers/${data.customerId}`)
    return { success: true, activity }
  } catch (error: any) {
    return { error: error.message || "Failed to add activity" }
  }
}
