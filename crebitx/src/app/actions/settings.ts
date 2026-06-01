"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults"
import { z } from "zod"
import { serverApi } from "@/lib/server-api"

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
    const data = await serverApi.get("/settings", session.user.accessToken!)
    return data
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(data: z.infer<typeof settingsSchema>) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  try {
    await serverApi.patch("/settings", session.user.accessToken!, data)
    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update settings" }
  }
}
