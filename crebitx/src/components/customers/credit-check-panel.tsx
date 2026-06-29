"use client"

import { useState, useTransition } from "react"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { runCreditCheck } from "@/app/actions/operating-intelligence"

function formatMoney(value: unknown) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`
}

const recommendationCopy: Record<string, { label: string; detail: string; tone: string }> = {
  APPROVE: {
    label: "APPROVE SALE",
    detail: "Customer is inside the current credit policy.",
    tone: "bg-[#cae8eb] text-[#005259]",
  },
  REQUIRE_PART_PAYMENT: {
    label: "REQUIRE PART PAYMENT",
    detail: "Take some payment first before giving more credit.",
    tone: "bg-[#ffdcc6] text-[#703d15]",
  },
  BLOCK: {
    label: "BLOCK NEW CREDIT",
    detail: "Customer risk is high for a fresh credit sale.",
    tone: "bg-[#ffdad6] text-[#ba1a1a]",
  },
}

export function CreditCheckPanel({ customerId }: { customerId: string }) {
  const [amount, setAmount] = useState("")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  const checkCredit = () => {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a sale amount first.")
      return
    }

    setError("")
    startTransition(async () => {
      const response = await runCreditCheck(customerId, numericAmount)
      if (response.success) {
        setResult(response.data)
      } else {
        setResult(null)
        setError(response.error || "Credit check failed.")
      }
    })
  }

  const recommendation = result?.recommendation || result?.decision || result?.status
  const config = recommendationCopy[recommendation] || {
    label: recommendation || "CHECK COMPLETE",
    detail: "Credit check completed using customer balance, risk, and promise history.",
    tone: "bg-[#cae8eb] text-[#005259]",
  }
  const reasons = Array.isArray(result?.reasons) ? result.reasons : []

  return (
    <div className="rounded-[2rem] bg-white p-6 border border-[rgba(190,200,202,0.15)] shadow-ambient-card">
      <div className="flex items-center gap-3 mb-5">
        <ShieldCheck size={20} className="text-[#005259]" />
        <h4 className="text-lg font-black text-[#1d1b18]">Credit Decision Check</h4>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="New sale amount"
          className="h-12 flex-1 rounded-xl bg-[#fef8f3] border border-[rgba(190,200,202,0.35)] px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#005259]/15"
        />
        <button
          type="button"
          disabled={pending}
          onClick={checkCredit}
          className="h-12 px-5 rounded-xl bg-[#005259] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          {pending ? "Checking" : "Check"}
        </button>
      </div>

      {error && <p className="mt-3 text-xs font-bold text-[#ba1a1a]">{error}</p>}

      {result && (
        <div className={`mt-4 rounded-2xl p-4 ${config.tone}`}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} />
            <p className="text-sm font-black">{config.label}</p>
          </div>
          <p className="mt-1 text-xs font-bold opacity-80">{config.detail}</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/65 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Due</p>
              <p className="text-sm font-black">{formatMoney(result.outstanding)}</p>
            </div>
            <div className="rounded-xl bg-white/65 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">After Sale</p>
              <p className="text-sm font-black">{formatMoney(result.projectedOutstanding)}</p>
            </div>
            <div className="rounded-xl bg-white/65 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Credit Limit</p>
              <p className="text-sm font-black">{formatMoney(result.creditLimit)}</p>
            </div>
          </div>

          {reasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs font-bold opacity-85">
              {reasons.map((reason: string) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
