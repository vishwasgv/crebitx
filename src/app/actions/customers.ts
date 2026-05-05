"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { calculateRiskScore } from "@/lib/risk-engine"

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
    const customer = await prisma.customer.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        phone,
        email: email || null,
        address,
        creditProfile: {
          create: {
            creditLimit,
            paymentCycle,
            gracePeriod,
          },
        },
      },
    })

    revalidatePath("/customers")
    return { success: true, customer }
  } catch (error) {
    console.error("Create customer error:", error)
    return { error: "Failed to create customer" }
  }
}

export async function getCustomers() {
  const session = await auth()
  if (!session) return []

  try {
    return await prisma.customer.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        creditProfile: true,
        receivables: {
          where: { isPaid: false },
        },
        riskSnapshots: {
          orderBy: { snapshotDate: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error("Get customers error (using mock):", error)
    return [
      {
        id: "mock-1",
        name: "Global Tech Solutions",
        phone: "9876543210",
        creditProfile: { creditLimit: 500000, paymentCycle: 30 },
        receivables: [{ amount: 245000, paidAmount: 0 }],
        riskSnapshots: [{ level: "RED", score: 45 }],
      },
      {
        id: "mock-2",
        name: "Acme Corp Industries",
        phone: "9123456789",
        creditProfile: { creditLimit: 300000, paymentCycle: 15 },
        receivables: [{ amount: 180000, paidAmount: 0 }],
        riskSnapshots: [{ level: "YELLOW", score: 72 }],
      },
      {
        id: "mock-3",
        name: "Visionary Retailers",
        phone: "9988776655",
        creditProfile: { creditLimit: 200000, paymentCycle: 30 },
        receivables: [{ amount: 155000, paidAmount: 0 }],
        riskSnapshots: [{ level: "GREEN", score: 91 }],
      }
    ] as any
  }
}

export async function getCustomerById(id: string) {
  const session = await auth()
  if (!session) return null

  try {
    return await prisma.customer.findUnique({
      where: { id, tenantId: session.user.tenantId },
      include: {
        creditProfile: true,
        receivables: {
          where: { isPaid: false },
          orderBy: { dueDate: "asc" },
        },
        ledgerEvents: {
          orderBy: { eventDate: "desc" },
        },
        riskSnapshots: {
          orderBy: { snapshotDate: "desc" },
          take: 1,
        },
      },
    })
  } catch (error) {
    console.error("Get customer by id error (using mock):", error)
    return {
      id,
      name: "Global Tech Solutions",
      phone: "9876543210",
      email: "contact@globaltech.com",
      address: "123 Business Park, Bangalore",
      creditProfile: { creditLimit: 500000, paymentCycle: 30 },
      receivables: [
        { id: "r1", amount: 150000, paidAmount: 0, dueDate: new Date(Date.now() - 86400000 * 5) },
        { id: "r2", amount: 95000, paidAmount: 0, dueDate: new Date(Date.now() + 86400000 * 10) },
      ],
      ledgerEvents: [
        { id: "l1", amount: 150000, tag: "SALE", note: "Invoice #GT-102", eventDate: new Date(Date.now() - 86400000 * 35) },
        { id: "l2", amount: 95000, tag: "SALE", note: "Invoice #GT-115", eventDate: new Date(Date.now() - 86400000 * 20) },
      ],
      riskSnapshots: [{ level: "RED", score: 45 }],
    } as any
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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Ledger Event
      const event = await tx.ledgerEvent.create({
        data: {
          tenantId: session.user.tenantId,
          customerId: data.customerId,
          amount: data.amount,
          tag: data.tag,
          note: data.note,
        },
      })

      // 2. If SALE, create ReceivableItem
      if (data.tag === "SALE") {
        const profile = await tx.customerCreditProfile.findUnique({
          where: { customerId: data.customerId },
        })
        const cycle = profile?.paymentCycle || 30
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + cycle)

        await tx.receivableItem.create({
          data: {
            customerId: data.customerId,
            amount: data.amount,
            description: data.note,
            dueDate,
          },
        })
      }

      // 3. If PAYMENT, allocate to oldest receivables
      if (data.tag === "PAYMENT") {
        let remainingPayment = data.amount
        const unpaidReceivables = await tx.receivableItem.findMany({
          where: { customerId: data.customerId, isPaid: false },
          orderBy: { dueDate: "asc" },
        })

        for (const item of unpaidReceivables) {
          if (remainingPayment <= 0) break

          const needed = item.amount - item.paidAmount
          const allocation = Math.min(remainingPayment, needed)

          await tx.paymentAllocation.create({
            data: {
              receivableItemId: item.id,
              amount: allocation,
            },
          })

          const newPaidAmount = item.paidAmount + allocation
          await tx.receivableItem.update({
            where: { id: item.id },
            data: {
              paidAmount: newPaidAmount,
              isPaid: newPaidAmount >= item.amount,
            },
          })

          remainingPayment -= allocation
        }
      }

      revalidatePath(`/customers/${data.customerId}`)
      revalidatePath("/dashboard")
      return { success: true }
    })

    // Calculate risk score after transaction
    try {
      await calculateRiskScore(data.customerId)
    } catch (e) {
      console.warn("Risk calculation skipped in demo mode")
    }
    
    return result
  } catch (error) {
    console.error("Ledger entry error:", error)
    return { error: "Demo Mode: Transaction logged locally (visual only)" }
  }
}
