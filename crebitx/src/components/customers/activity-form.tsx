"use client"

import { useState } from "react"
import { addActivity } from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar, Phone, Handshake, PenTool } from "lucide-react"

export function ActivityDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<"CALL" | "MEETING" | "PROMISE_TO_PAY" | "NOTE">("CALL")
  const [desc, setDesc] = useState("")
  const [promiseDate, setPromiseDate] = useState("")
  const [promiseAmount, setPromiseAmount] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addActivity({
        customerId,
        type,
        description: desc,
        promiseDate: type === "PROMISE_TO_PAY" ? promiseDate : undefined,
        promiseAmount: type === "PROMISE_TO_PAY" && promiseAmount ? parseFloat(promiseAmount) : undefined,
      })

      if (result.success) {
        setOpen(false)
        setDesc("")
        setPromiseDate("")
        setPromiseAmount("")
        setType("CALL")
      } else {
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full h-14 bg-white hover:bg-[#f9f3ed] text-[#005259] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-ambient border border-[rgba(190,200,202,0.3)] active:scale-95">
        <PenTool size={18} /> Add Activity Note
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#fef8f3] border-[rgba(190,200,202,0.3)] shadow-ambient-card rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1d1b18]">Log Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "CALL", icon: Phone, label: "Call" },
              { id: "MEETING", icon: Calendar, label: "Meet" },
              { id: "NOTE", icon: PenTool, label: "Note" },
              { id: "PROMISE_TO_PAY", icon: Handshake, label: "PTP" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setType(btn.id as any)}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                  type === btn.id
                    ? "bg-[#005259] text-white border-[#005259]"
                    : "bg-white text-[#6f797a] border-[rgba(190,200,202,0.3)] hover:bg-[#f3ede8]"
                }`}
              >
                <btn.icon size={16} />
                <span className="text-[10px] font-bold uppercase">{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-[#6f797a] uppercase tracking-widest">
              Description / Notes
            </Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What happened?"
              required
              className="bg-white border-[rgba(190,200,202,0.3)] focus-visible:ring-[#005259]"
            />
          </div>

          {type === "PROMISE_TO_PAY" && (
            <div className="grid grid-cols-2 gap-4 bg-[#cae8eb]/20 p-4 rounded-2xl border border-[rgba(190,200,202,0.2)]">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#005259] uppercase tracking-widest">
                  Promise Date
                </Label>
                <Input
                  type="date"
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#005259] uppercase tracking-widest">
                  Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={promiseAmount}
                  onChange={(e) => setPromiseAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  className="bg-white"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-[#1d1b18] hover:bg-[#32302d] text-white font-bold rounded-xl"
          >
            {loading ? "Saving..." : "Save Activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
