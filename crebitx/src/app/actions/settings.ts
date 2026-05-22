"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults"
import { z } from "zod"
import { api } from "@/lib/api"

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

  try {
    const response = await api.get("/settings", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })
    return response.data.data
  } catch (error) {
    console.error("Get settings error (using defaults):", error)
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(data: z.infer<typeof settingsSchema>) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    await api.patch("/settings", data, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    console.error("Update settings error:", error)
    return { error: error.message || "Failed to update settings" }
  }
}

