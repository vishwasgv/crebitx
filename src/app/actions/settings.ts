"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const settingsSchema = z.object({
  defaultCycle: z.number().min(1),
  defaultGrace: z.number().min(0),
  reminderTone: z.enum(["FRIENDLY", "BALANCED", "STRICT"]),
  autoApproveLimit: z.number().min(0),
})

export async function getSettings() {
  const session = await auth()
  if (!session) return null

  const tenantId = session.user.tenantId

  let config = await prisma.businessConfig.findUnique({
    where: { tenantId },
  })

  if (!config) {
    config = await prisma.businessConfig.create({
      data: {
        tenantId,
        defaultCycle: 30,
        defaultGrace: 7,
        reminderTone: "FRIENDLY",
        autoApproveLimit: 0,
      },
    })
  }

  return config
}

export async function updateSettings(data: z.infer<typeof settingsSchema>) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const tenantId = session.user.tenantId

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
