"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { recordRecommendedAction } from "@/app/actions/operating-intelligence"

export function HeroActionButtons({ actionId }: { actionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "accept" | "dismiss">("idle")
  const [error, setError] = useState("")

  const updateAction = (nextStatus: "accept" | "dismiss") => {
    setError("")
    startTransition(async () => {
      const result = await recordRecommendedAction(actionId, nextStatus)
      if (result.success) {
        setStatus(nextStatus)
        router.refresh()
      } else {
        setError(result.error || "Action update failed")
      }
    })
  }

  if (status !== "idle") {
    return (
      <div className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm">
        {status === "accept" ? "Marked as resolved" : "Dismissed"}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => updateAction("accept")}
        className="bg-white text-[#005259] px-8 py-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 hover:shadow-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
      >
        {pending ? "Saving..." : "Resolve Now"} <ArrowRight size={16} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => updateAction("dismiss")}
        className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 hover:bg-white/20 disabled:opacity-50"
      >
        Dismiss
      </button>
      {error && <p className="w-full text-xs font-bold text-white/80">{error}</p>}
    </div>
  )
}
