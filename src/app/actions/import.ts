"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function importCustomers(customers: any[]) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const tenantId = session.user.tenantId

  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdCount = 0
      for (const row of customers) {
        if (!row.name) continue
        
        await tx.customer.create({
          data: {
            tenantId,
            name: row.name,
            phone: row.phone?.toString(),
            email: row.email,
            address: row.address,
            creditProfile: {
              create: {
                creditLimit: parseFloat(row.creditLimit) || 0,
                paymentCycle: parseInt(row.paymentCycle) || 30,
              },
            },
          },
        })
      }
      return { success: true, count: customers.length }
    })

    revalidatePath("/customers")
    return result
  } catch (error) {
    console.error("Import error:", error)
    return { error: "Failed to import customers" }
  }
}
