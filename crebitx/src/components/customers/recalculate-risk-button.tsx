"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { recalculateCustomerRisk } from "@/app/actions/customers"

export function RecalculateRiskButton({ customerId }: { customerId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const router = useRouter()

  const onClick = () => {
    setError("")
    startTransition(async () => {
      const result = await recalculateCustomerRisk(customerId)
      if (!result.success) {
        setError(result.error || "Failed to recalculate risk score.")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#005259] hover:text-[#0f6c74] disabled:opacity-50 transition-colors"
      >
        <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
        {pending ? "Recalculating" : "Recalculate"}
      </button>
      {error && <p className="text-[10px] font-bold text-[#ba1a1a]">{error}</p>}
    </div>
  )
}
