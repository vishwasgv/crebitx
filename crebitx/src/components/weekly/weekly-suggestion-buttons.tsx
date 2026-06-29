"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, X } from "lucide-react"
import { applyWeeklySuggestion, dismissWeeklySuggestion } from "@/app/actions/operating-intelligence"

export function WeeklySuggestionButtons({
  reviewId,
  suggestionId,
}: {
  reviewId: string
  suggestionId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const updateSuggestion = (mode: "apply" | "dismiss") => {
    startTransition(async () => {
      if (mode === "apply") {
        await applyWeeklySuggestion(reviewId, suggestionId)
      } else {
        await dismissWeeklySuggestion(reviewId, suggestionId)
      }
      router.refresh()
    })
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => updateSuggestion("apply")}
        className="flex items-center gap-2 text-[10px] font-black text-[#005259] uppercase tracking-widest hover:translate-x-1 transition-transform disabled:opacity-50"
      >
        Apply Rule <CheckCircle2 size={14} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => updateSuggestion("dismiss")}
        className="flex items-center gap-2 text-[10px] font-black text-[#ba1a1a] uppercase tracking-widest hover:translate-x-1 transition-transform disabled:opacity-50"
      >
        Dismiss <X size={14} />
      </button>
    </div>
  )
}
