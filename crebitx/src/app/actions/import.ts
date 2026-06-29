"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { api } from "@/lib/api"

export async function importCustomers(customers: any[]) {
  const session = await auth()
  if (!session) return { success: false, error: "Unauthorized" }

  const validRows = customers.filter((row) => row.name)

  if (validRows.length === 0) {
    return { success: false, error: "No valid rows to import" }
  }

  let createdCount = 0
  const errors: string[] = []

  for (const row of validRows) {
    try {
      await api.post(
        "/customers",
        {
          name: row.name,
          phone: row.phone?.toString() || undefined,
          email: row.email || undefined,
          address: row.address || undefined,
          creditLimit: parseFloat(row.creditLimit) || 0,
          paymentCycle: parseInt(row.paymentCycle) || 30,
          gracePeriod: parseInt(row.gracePeriod) || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        }
      )
      createdCount++
    } catch (err: any) {
      errors.push(`Failed to import "${row.name}": ${err?.message || "Unknown error"}`)
    }
  }

  revalidatePath("/customers")

  if (errors.length > 0 && createdCount === 0) {
    return { success: false, error: `All imports failed: ${errors[0]}` }
  }

  return {
    success: true,
    count: createdCount,
    ...(errors.length > 0 && { warnings: errors }),
  }
}

