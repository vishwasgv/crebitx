"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addLedgerEntry } from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Plus, Minus, RotateCcw, PenTool, RefreshCw } from "lucide-react"

const entrySchema = z.object({
  amount: z.number().min(1, "Amount is required"),
  tag: z.enum(["SALE", "PAYMENT", "RETURN", "ADJUSTMENT"]),
  note: z.string().optional(),
})

export function AddEntryForm({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false)
  const [tag, setTag] = useState<"SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT">("SALE")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      tag: "SALE",
      amount: 0,
    },
  })

  async function onSubmit(data: z.infer<typeof entrySchema>) {
    setLoading(true)
    const result = await addLedgerEntry({
      customerId,
      amount: data.amount,
      tag: data.tag,
      note: data.note,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${data.tag} entry added!`)
      reset()
      router.refresh()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#fef8f3]/95 backdrop-blur-xl border-t border-[rgba(190,200,202,0.3)] z-50 shadow-[0_-12px_40px_rgba(35,33,30,0.08)] rounded-t-[2.5rem]">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Animated Tabs */}
        <Tabs defaultValue="SALE" onValueChange={(v) => setTag(v as any)} className="w-full">
          <TabsList className="grid grid-cols-4 h-12 p-1.5 bg-[#f3ede8] rounded-2xl gap-1">
            <TabsTrigger value="SALE" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-[#005259] data-[state=active]:text-white transition-all flex items-center gap-2">
              <Plus size={12} /> Sale
            </TabsTrigger>
            <TabsTrigger value="PAYMENT" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-[#4CAF50] data-[state=active]:text-white transition-all flex items-center gap-2">
              <Minus size={12} /> Pay
            </TabsTrigger>
            <TabsTrigger value="RETURN" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-[#ba1a1a] data-[state=active]:text-white transition-all flex items-center gap-2">
              <RotateCcw size={12} /> Ret
            </TabsTrigger>
            <TabsTrigger value="ADJUSTMENT" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-[#703d15] data-[state=active]:text-white transition-all flex items-center gap-2">
              <PenTool size={12} /> Adj
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-4">
          <input type="hidden" value={tag} {...register("tag")} />
          
          <div className="flex-1 flex items-center bg-white rounded-2xl px-5 h-14 border border-[rgba(190,200,202,0.2)] shadow-ambient-card focus-within:ring-2 focus-within:ring-[#005259]/10 transition-all">
            <span className="text-[#005259] font-black text-lg mr-3">₹</span>
            <Input 
              type="number" 
              {...register("amount", { valueAsNumber: true })} 
              placeholder="0.00" 
              className="border-none shadow-none focus-visible:ring-0 bg-transparent h-full p-0 text-2xl font-black text-[#1d1b18] placeholder:text-[#bec8ca] w-32"
            />
            <div className="w-px h-8 bg-[#f3ede8] mx-4" />
            <Input 
              {...register("note")} 
              placeholder="Add internal note..." 
              className="border-none shadow-none focus-visible:ring-0 bg-transparent h-full p-0 text-sm font-semibold text-[#3f494a] placeholder:text-[#bec8ca]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-14 h-14 rounded-2xl shadow-ambient-lg flex items-center justify-center transition-all active:scale-90 hover:scale-105 disabled:opacity-50 ${
              tag === "PAYMENT" ? "bg-[#4CAF50]" : 
              tag === "SALE" ? "bg-[#005259]" :
              tag === "RETURN" ? "bg-[#ba1a1a]" :
              "bg-[#703d15]"
            }`}
          >
            {loading ? (
              <RefreshCw size={22} className="text-white animate-spin" />
            ) : (
              <Send size={24} className="text-white ml-0.5" />
            )}
          </button>
        </form>

        <div className="flex justify-center">
          <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest opacity-40">
            Secure Ledger Synchronization
          </p>
        </div>
      </div>
    </div>
  )
}
