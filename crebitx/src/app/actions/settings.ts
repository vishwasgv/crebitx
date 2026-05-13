"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults"
import { z } from "zod"

const settingsSchema = z.object({
  defaultCycle: z.number().min(1),
  defaultGrace: z.number().min(0),
  reminderTone: z.enum(["FRIENDLY", "BALANCED", "STRICT"]),
  autoApproveLimit: z.number().min(0),
  riskWeightDelay: z.number().min(0).max(1),
  riskWeightLimit: z.number().min(0).max(1),
})

export async function getSettings() {
  const session = await auth()
  if (!session) return null

  const tenantId = session.user.tenantId
  if (!tenantId) return DEFAULT_SETTINGS

  try {
    let config = await prisma.businessConfig.findUnique({
      where: { tenantId },
    })

    if (!config) {
      config = await prisma.businessConfig.create({
        data: {
          tenantId,
          ...DEFAULT_SETTINGS,
        },
      })
    }

    return config
  } catch (error) {
    console.error("Get settings error (using defaults):", error)
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(data: z.infer<typeof settingsSchema>) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const tenantId = session.user.tenantId
  if (!tenantId) return { error: "No tenant found for this account" }

  try {
    await prisma.businessConfig.upsert({
      where: { tenantId },
      update: data,
      create: {
        tenantId,
        ...data,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Update settings error:", error)
    return { error: "Failed to update settings" }
  }
}
