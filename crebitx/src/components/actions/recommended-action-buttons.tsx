"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, X } from "lucide-react"
import { recordRecommendedAction } from "@/app/actions/operating-intelligence"

export function RecommendedActionButtons({ actionId }: { actionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "accept" | "postpone" | "dismiss">("idle")
  const [error, setError] = useState("")

  const updateAction = (nextStatus: "accept" | "postpone" | "dismiss") => {
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
    const label = status === "accept" ? "Accepted" : status === "postpone" ? "Postponed" : "Dismissed"
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="h-12 px-5 rounded-xl bg-[#cae8eb] text-[#005259] font-black text-xs uppercase tracking-widest flex items-center gap-2">
          {label} <CheckCircle2 size={16} />
        </div>
        {error && <p className="text-[10px] font-bold text-[#ba1a1a]">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => updateAction("accept")}
          className="h-12 px-5 rounded-xl bg-[#005259] text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#0f6c74] transition-all disabled:opacity-50"
        >
          {pending ? "Saving" : "Accept"} <CheckCircle2 size={16} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => updateAction("postpone")}
          className="w-12 h-12 rounded-xl bg-[#f3ede8] text-[#703d15] flex items-center justify-center hover:bg-[#ffdcc6] transition-all disabled:opacity-50"
          aria-label="Postpone action"
        >
          <Clock size={18} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => updateAction("dismiss")}
          className="w-12 h-12 rounded-xl bg-white text-[#ba1a1a] border border-[rgba(190,200,202,0.25)] flex items-center justify-center hover:bg-[#ffdad6] transition-all disabled:opacity-50"
          aria-label="Dismiss action"
        >
          <X size={18} />
        </button>
      </div>
      {error && <p className="text-[10px] font-bold text-[#ba1a1a]">{error}</p>}
    </div>
  )
}
