"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { completeDailyBriefItem } from "@/app/actions/operating-intelligence"

export function DailyBriefItemButton({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await completeDailyBriefItem(itemId)
          router.refresh()
        })
      }
      className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-[#005259] transition-all disabled:opacity-50"
      aria-label="Complete brief item"
    >
      <CheckCircle2 size={18} />
    </button>
  )
}
