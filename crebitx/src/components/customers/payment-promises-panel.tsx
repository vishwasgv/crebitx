"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, CheckCircle2, Handshake, IndianRupee, XCircle } from "lucide-react"
import { addActivity, markPaymentPromiseBroken, markPaymentPromiseKept } from "@/app/actions/customers"

function formatDate(value?: string) {
  if (!value) return "No date"
  return new Date(value).toLocaleDateString("en-IN")
}

export function PaymentPromisesPanel({
  customerId,
  promises,
}: {
  customerId: string
  promises: any[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")

  const createPromise = () => {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0 || !date) {
      setMessage("Enter amount and promised date first.")
      return
    }

    setMessage("")
    startTransition(async () => {
      const result = await addActivity({
        customerId,
        type: "PROMISE_TO_PAY",
        description: note || `Promised to pay Rs. ${numericAmount.toLocaleString("en-IN")}`,
        promiseAmount: numericAmount,
        promiseDate: date,
      })

      if (result.success) {
        setAmount("")
        setDate("")
        setNote("")
        setMessage("Promise saved.")
        router.refresh()
      } else {
        setMessage(result.error || "Could not save promise.")
      }
    })
  }

  const updateStatus = (promiseId: string, status: "KEPT" | "BROKEN") => {
    startTransition(async () => {
      if (status === "KEPT") {
        await markPaymentPromiseKept(promiseId, customerId)
      } else {
        await markPaymentPromiseBroken(promiseId, customerId)
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] bg-white p-5 border border-[rgba(190,200,202,0.2)] shadow-ambient-card">
        <div className="flex items-center gap-2 mb-4">
          <Handshake size={18} className="text-[#005259]" />
          <p className="text-sm font-black text-[#1d1b18] uppercase tracking-widest">Record New Promise</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="relative">
            <IndianRupee size={16} className="absolute left-4 top-4 text-[#005259]" />
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Promised amount"
              className="h-12 w-full rounded-xl bg-[#fef8f3] border border-[rgba(190,200,202,0.35)] pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#005259]/15"
            />
          </label>
          <label className="relative">
            <CalendarDays size={16} className="absolute left-4 top-4 text-[#005259]" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-12 w-full rounded-xl bg-[#fef8f3] border border-[rgba(190,200,202,0.35)] pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#005259]/15"
            />
          </label>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
          rows={2}
          className="mt-3 w-full resize-none rounded-xl bg-[#fef8f3] border border-[rgba(190,200,202,0.35)] px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#005259]/15"
        />
        <button
          type="button"
          disabled={pending}
          onClick={createPromise}
          className="mt-3 h-11 w-full rounded-xl bg-[#005259] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Promise"}
        </button>
        {message && <p className="mt-3 text-xs font-bold text-[#005259]">{message}</p>}
      </div>

      {promises.map((promise) => (
        <div key={promise.id} className="rounded-2xl bg-white p-5 border border-[rgba(190,200,202,0.2)] shadow-ambient-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-black text-[#005259]">Rs. {Number(promise.amount || 0).toLocaleString()}</p>
              <p className="text-xs font-bold text-[#6f797a] uppercase tracking-widest">
                Due {formatDate(promise.promisedDate)} - {promise.status}
              </p>
              {promise.note && <p className="mt-2 text-sm font-medium text-[#3f494a]">{promise.note}</p>}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                promise.status === "KEPT"
                  ? "bg-[#cae8eb] text-[#005259]"
                  : promise.status === "BROKEN"
                    ? "bg-[#ffdad6] text-[#ba1a1a]"
                    : "bg-[#f3ede8] text-[#703d15]"
              }`}
            >
              {promise.status}
            </span>
          </div>

          {promise.status === "PENDING" && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => updateStatus(promise.id, "KEPT")}
                className="h-10 px-4 rounded-xl bg-[#005259] text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                Kept <CheckCircle2 size={14} />
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => updateStatus(promise.id, "BROKEN")}
                className="h-10 px-4 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                Broken <XCircle size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {promises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#bec8ca] p-5 text-sm font-bold text-[#6f797a]">
          No payment promises recorded yet. Use the form above to add the first promised amount and date.
        </div>
      )}
    </div>
  )
}
